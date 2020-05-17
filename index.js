// Store
// it uses pouchdb to synch a memory store with a general database
import PouchDB from 'pouchdb'
import Find from 'pouchdb-find'
import Memory from "pouchdb-adapter-memory";
import STORES from "../Bootstrap/Store/index.js";
PouchDB.plugin(Find);
PouchDB.plugin(Memory);

// each instance of Store, create its own database
// each database can be sync with other general databases (see config stores.js)

export default class Store{
    constructor(params = {}){
        let {id,simulation,type} = params;
        if(!type || !STORES.has(type)){
            throw new Error(`Error: unknown store ${type}`);
        }
        // priority to simulation
        if(simulation){
            this.simulation = simulation;
        } else if(id){
            this.id = id;
        }

        this.type = type;

        this.DB = STORES.get(type);
    }


    async read(){
        if(!this.DB){return Promise.reject("DB must be initialized first!")}

        return new Promise((resolve,reject)=> {
            this.DB.allDocs({
                include_docs:true
            }).then(
                response => {
                    resolve(response.rows.map(e=>e.doc))
                }
            ).catch(err => reject(err));
        });
    }

    async save(doc){
        if(!doc){
            return Promise.reject(`ERROR, nothing to save`);
        }

        // bulk save
        if(Array.isArray(doc)){return this._saveBulk(doc)}

        // save
        return this._save(doc);
    }


    async _save(doc){
        return new Promise((resolve,reject)=>{
            // console.log("saving here 2",store);
            this.DB.post(doc)
                .then( response => {
                    // console.log("saved 3?",response);
                    resolve(response);
                } )
                .catch( err => {
                    // console.error("4",err);
                    reject(err);
                } );

        });
    }
    async _saveBulk(docs){
        return new Promise((resolve,reject)=>{
            // console.log("saving here 2",store);
            this.DB.bulkDocs(docs)
                .then(res=>{
                    // console.log("bulk result?",res);
                    resolve(res)
                })
                .catch(err=>reject(err));
        });
    }



    get DB(){return this._DB;}

    set DB(params){

        let name = this._dbName(params);

        let db = new PouchDB(name);
        // let db = new PouchDB(name,{adapter: "memory"});

        // setup connections
        this._connectDB(params,db);

        // update _sections
        this._DB = db;
    }

    _dbName(params){
        let name = params.name;
        // console.log("store type",type," with id ",id);

        if(this.id && params.id === true ){
            name = name.toString().concat("-",this.id);
        }
        if(this.simulation && params.simulation === true ){
            name = name.toString().concat("-",this.simulation);
        }

        return name
    }

    _connectDB(params,db){
        let path = null, operation = null;
        if(params.to){
            path = params.to;
            operation = "to";
        } else if(params.from){
            path = params.from;
            operation = "from";
        } else if(params.sync){
            path = params.sync;
            operation = "sync";
        }
        // check if db exists or created it
        if(path) {
            path = path.concat(this._dbName(params));
            let linkedDB = new PouchDB(path);
            let repParams = params.repParams ? params.repParams : {};
            // console.log("-----",db.name,operation,path);
            // connect
            let handler = null;
            switch (operation){
                case "to":
                    handler = db.replicate.to(linkedDB,repParams);
                    break;
                case "from":
                    handler = db.replicate.from(linkedDB,repParams);
                    break;
                default:
                    handler = db.sync(linkedDB,repParams);
            }
            // save handler to cancel replication later
            this.replicationHandler = handler;
        }

    }
    async cleanUp(params={}){
        // console.log("1",params.id && !this.store[section].id && this.store[section].id !== params.id);
        if( params.id && this.id !== params.id ){
            return Promise.resolve("nothing to do");
        }
        // console.log("2",params.simulation && !this.store[section].simulation && this.store[section].simulation !== params.simulation);
        if( params.simulation && this.simulation !== params.simulation ){
            return Promise.resolve("nothing to do");
        }
        // console.log("3");
        return Promise.allSettled([
            this._DB.destroy(),
            this._disconnectDB()
        ]);
    }
    async _disconnectDB(){
        return new Promise((resolve,reject)=>{
            if(this.replicationHandler){
                this.replicationHandler.cancel()
                    .on("complete", (res)=>resolve(res))
                    .on("error",(err)=>reject(err))
            }
            resolve("nothing to do");
        })
    }




}
