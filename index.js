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
    constructor(type, params = {}){
        let {id,simulation} = params;
        if(!type || !STORES.has(type)){
            throw new Error(`Error: unknown store {type}`);
        }
        // priority to simulation
        if(simulation){
            this.simulation = simulation;
        } else if(id){
            this.id = id;
        }


        this.type = type;
        this.store = STORES.get(type);
        this.sections = Object.keys(this.store);
        this.sectionsSet = new Set(this.sections);
        this.replicationHandlers = {};

        this.names = new Map();
        this._sections = this.sections.reduce((p,section)=>{
            let store = this.store[section];
            let name = store.name;

            // console.log("store type",type," with id ",id);

            if(this.id && store.id === true ){
                name = this.id.toString().concat("-",name);
            }
            if(this.simulation && store.simulation === true ){
                name = this.simulation.toString().concat("-",name);
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

    async allDocs(section){
        return new Promise((resolve,reject)=> {
            if (!this._sections.has(section)) {
                reject(`ERROR: unknown ${section} section`);
            }
            let store = this._sections.get(section);
            store.allDocs({
                include_docs:true
            }).then(
                response => {
                    resolve(response.rows)
                }
            ).catch(err => reject(err));
        });
    }


    async readBySection(section, selector){
        return new Promise((resolve,reject)=> {
            if (!this._sections.has(section)) {
                reject(`ERROR: unknown ${section} section`);
            }
            let store = this._sections.get(section);
            store.find({
                selector: store.selector || {},
            }).then(
                response => resolve(response)
            ).catch(err => reject(err));
        });
    }
    readByField(){}

    async save(section,doc){
        return new Promise((resolve,reject)=>{
            // console.log("section",section,this.sectionsSet);
            if(!section || !this.sectionsSet.has(section)){
                reject("ERROR, section required or unknown section");
            }
            if(!doc){
                reject(`ERROR, nothing to save`);
            }


            // console.log("~~~~~",this.store[section]);

            // check mandatory fields
            if(Array.isArray(this.store[section].fields)) {
                this.store[section].fields.forEach((field, i) => {
                    if (!doc.hasOwnProperty(field)) {
                        reject(`ERROR, missing required param ${field}`);
                    }
                });
            }
            // id is the key for the store
            let payload = Object.assign({},doc,{agent:this.id,});
            let store = this._sections.get(section);
            // console.log("saving here",section);
            store.post(payload)
                .then( response => {
                    // console.log("~~~",response);
                    resolve(response);
                } )
                .catch( err => reject(err) );

        });
    }


    async cleanUp(params){
        // console.log("cleanUp: ", params);
        let res = this.sections.map(async (section)=>{
            await this._bulkTo(section);
            await this._cleanUpDB(params,section);
            return `${section} done`;
        },[]);
        return res;
    }

    async _bulkTo(section){
        return new Promise(async (resolve,reject)=>{
            let store = this.store[section];
            // console.log("bulk ", section, store.hasOwnProperty("bulkTo"));
            if(!store.hasOwnProperty("bulkTo")){resolve("nothing to do")}
            else{
                let path = store.bulkTo;

                // check if there is a bulk address
                let appendix = store.name;
                let middle = "";
                if(this.id && store.id === true ){
                    middle = middle.concat(this.id,"-");
                }
                if(this.simulation && store.simulation === true ){
                    middle = middle.concat(this.simulation,"-");
                }
                path = path.concat(middle,appendix);
                let bulkDB = new PouchDB(path);


                // get all docs in local store
                let docs = await this.allDocs(section);
                // console.log("docs? ",docs);
                // bulk all docs in remote store
                bulkDB.bulkDocs(docs)
                    .then(res=>{
                        // console.log("bulk result?",res);
                        resolve(res)
                    })
                    .catch(err=>reject(err));
            }


        });

    }

    _initDBs(){
        this._sections = this.sections.reduce((p,section)=>{
            let db = new PouchDB(section);
            p.set(section,db);
            return p;
        },new Map());
    }
    async _cleanUpDBs(params){
        // console.log("cleanUp: ", params);
        let dbPromises = this.sections.reduce(async (r,section)=>{
            r.push(this._cleanUpDB(params,section));
            // remove from _sections
            return r;
        },[]);
        return Promise.allSettled(dbPromises);
    }
    async _cleanUpDB(params,section){
        if(params.id && !this._sections.get(section).id){
            return Promise.resolve("nothing to do");
        }
        if(params.simulation && !this._sections.get(section).simulation){
            return Promise.resolve("nothing to do");
        }

        return Promise.allSettled([
            this._sections.get(section).destroy(),
            this._disconnectDB(section)
        ]);
    }

    async _disconnectDB(section){
        return new Promise((resolve,reject)=>{
            if(this.replicationHandlers.hasOwnProperty(section)){
                this.replicationHandlers.cancel()
                    .on("complete", (res)=>resolve(res))
                    .on("error",(err)=>reject(err))
            }
            resolve("nothing to do");
        })
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
            let appendix = store.name;
            let middle = "";
            if(this.id && store.id === true ){
                middle = middle.concat(this.id,"-");
            }
            if(this.simulation && store.simulation === true ){
                middle = middle.concat(this.simulation,"-");
            }
            path = path.concat(middle,appendix);
            let linkedDB = new PouchDB(path);
            // console.log("-----",db.name,operation,path);
            // connect
            let handler = null;
            switch (operation){
                case "to":
                    handler = db.replicate.to(linkedDB,store.repParams);
                    break;
                case "from":
                    handler = db.replicate.from(linkedDB,store.repParams);
                    break;
                default:
                    handler = db.sync(linkedDB,store.repParams);
            }
            // save handler to cancel replication later
            this.replicationHandlers[store.name] = handler;
        }

    }
}
