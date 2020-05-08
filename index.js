// Store
// it uses pouchdb to synch a memory store with a general database
import uniqid from "uniqid";
import PouchDB from 'pouchdb'
import Find from 'pouchdb-find'
import Memory from "pouchdb-adapter-memory";
import STORES from "./stores.js";
PouchDB.plugin(Find);
PouchDB.plugin(Memory);

// each instance of Store, create its own database
// each database can be sync with other general databases (see config stores.js)

export default class Store{
    constructor(type,id){
        if(!type || !STORES.has(type)){
            throw new Error(`Error: unknown store {type}`);
        }
        if(id){
            this.id = id;
        }


        this.type = type;
        this.store = STORES.get(type);
        this.sections = Object.keys(this.store);
        this.sectionsSet = new Set(this.sections);


        this.names = new Map();
        this._sections = this.sections.reduce((p,section)=>{
            let store = this.store[section];
            let name = store.name;

            // console.log("store type",type," with id ",id);

            if(this.id && store.id !== false ){
                name = name.concat("-",this.id)
            }

            this.names.set(section,name);


            let db = new PouchDB(name);
            // let db = new PouchDB(name,{adapter: "memory"});

            // setup connections
            this._connectDB(store,db);


            p.set(section,db);
            return p;
        },new Map());
    }

    cleanup(){
        this._destroyDBs();
    }

    readBySection(section){
        return new Promise((resolve,reject)=> {
            if (!this._sections.has(section)) {
                reject(`ERROR: unknown ${section} section`);
            }
            let store = this._sections.get(section);
            store.find({
                selector: {
                    agent: {$eq: this.id},
                    date: {$exists: true}
                },
            }).then(
                response => resolve(response)
            ).catch(err => reject(err));
        });
    }
    readByField(){}

    save(section,doc){
        return new Promise((resolve,reject)=>{

            if(!section || !this.sectionsSet.has(section)){
                reject("ERROR, section required or unknown section");
            }
            if(!doc){
                reject(`ERROR, nothing to save`);
            }


            // console.log(section,doc, this.store[section]);

            // check mandatory fields
            this.store[section].fields.forEach((field,i)=>{
                if(!doc.hasOwnProperty(field)){
                    reject(`ERROR, missing required param ${field}`);
                }
            });
            // id is the key for the store
            let payload = Object.assign({},doc,{agent:this.id,});
            let store = this._sections.get(section);

            store.post(payload)
                .then( response => resolve(response) )
                .catch( err => reject(err) );

        });

    }

    _initDBs(){
        this._sections = this.sections.reduce((p,section)=>{
            let db = new PouchDB(section);
            p.set(section,db);
            return p;
        },new Map());
    }
    _destroyDBs(){
        this.sections.map((section)=>{
            this._sections.get(section).destroy().then(res=> {
                // console.log(res);
            }).catch(err=>console.error(err));

        });
        this._sections = new Map();
    }

    _connectDB(store,db){
        let path = null, operation = null;
        if(store.to){
            path = store.to;
            operation = "to";
        }
        if(store.from){
            path = store.from;
            operation = "from";
        }
        if(store.sync){
            path = store.sync;
            operation = "sync";
        }
        // check if db exists or created it
        if(path) {
            let linkedDB = new PouchDB(path);
            console.log("-----",db.name,operation,path);
            // connect
            switch (operation){
                case "to":
                    db.replicate.to(linkedDB,{live:true,retry:true});
                    break;
                case "from":
                    db.replicate.from(linkedDB,{live:true,retry:true});
                    break;
                default:
                    db.sync(linkedDB,{live:true,retry:true});
            }
        }

    }
}
