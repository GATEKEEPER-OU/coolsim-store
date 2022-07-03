// Store
import STORES from "../configuration/Store/index.js";
import FileStore from './file-store.js';
import DBStore from './db-store.js';

// each instance of Store, create its own database
export default class Store{
    constructor(params = {id,simulation,type}){
        if(!params.type || !STORES.has(params.type)){
            throw new Error(`Error: unknown store ${type}`);
        }
        if(!params.id&&!params.simulation){
            throw new Error(`Error: id or simulation mandatory!`);
        }
        this.type = params.type;
        this.simulation = params.simulation;
        this.id = params.id;
        this.name = this._generateName(params);
        this.mode = STORES.get(params.type).mode;
        this.format = STORES.get(params.type).format;
        // console.log("store params",this.name,this.type,this.mode,this.format);
        switch(this.mode){
            case "file":
                console.log("instantiating file mode",this.format);
                this._DB = new FileStore(this.name,this.format);
                break;
            default:
                this._DB = new DBStore(this.name,this.mode,this.format);
        }
    }
    get DB(){return this._DB;}

    async read(params){
        if(!this.DB){return Promise.reject("DB must be initialized first!")}
        // @todo what from where?
        return this.DB.read();
    }

    async save(doc){
        if(!doc){
            return Promise.reject(`ERROR, nothing to save`);
        }

        // @todo array of adapters
        // mapping between adapters and output formats
        // e.g. FHIR > file, default > db

        return this.DB.save(doc);
    }


    async cleanUp(params={}){
        // @todo cleanup of what adapter?
        return this.DB.cleanUp(params);
    }


    _generateName({name = "", id, simulation}){
        // console.log("_generateName, params",name,id,simulation);
        // console.log("store type",type," with id ",id);

        if(simulation){
            name = name.toString().concat("-",simulation);
        } else if(id){
            name = name.toString().concat("-",id);
        }
        console.log("_generateName, name",name);
        return name
    }
}