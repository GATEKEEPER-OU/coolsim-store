import * as fs from 'fs';
import uniqid from "uniqid";
import FHIRTrasformer from "./fhir-transformer.js";

export default class FileStore {
    DIR = "./output";
    BASENAME = "diary-";
    constructor(name, format="default"){
        if(!name ){
            throw new Error(`Error: missing mandatory name param`);
        }
        switch(format){
            case "FHIR":
            case "fhir":
                console.log("using FHIR format");
                this._converterHelper = new FHIRTrasformer();
            break;
            default:
                this._converterHelper = {
                    convert: (doc) => doc
                };
        }


        // init main output folder
        // console.log("dir",this.DIR,"dir exists?",fs.existsSync(this.DIR))
        if (!fs.existsSync(this.DIR)){
            fs.mkdirSync(this.DIR);
            // console.log("making a dir")
        }
        this._name = name;
        this._path = this.DIR.concat("/",this._name);
        if (!fs.existsSync(this._path)){
            fs.mkdirSync(this._path);
            // console.log("making a dir",this._path);
        }
    }

    async read(){
        // return this._path
        return Promise.resolve(this._path);
        // return Promise.reject(`"file" mode does not allow read operations`);
    }

    async save(doc){
        if(!doc){
            return Promise.reject(`ERROR, nothing to save`);
        }
        // todo save arrays in files
        // save single file
        // console.log("saving",doc,"on directory",this._path);

        if(Array.isArray(doc)){
            return this._saveBulk(doc)
        }else{
            return this._saveFile(doc);
        }
    }

    async _saveBulk(doc){
        return doc.map((d)=>{
            this._saveFile(d);
        });
    }

    async _saveFile(raw){
        if(!raw){
            console.log(raw)
            throw `document is mandator, got ${raw}`;
        }
        let fileName = this._generateFileName(raw);
        let filePath = this._path.concat("/",fileName,".json");
        // conversion in FHIR or other formats
        let doc = this._converterHelper.convert(raw);
        let data = JSON.stringify(doc);
        return fs.writeFileSync(filePath, data);
    }

    _generateFileName(doc){
        let fileName = this.BASENAME;

        if(doc.day){
            fileName = fileName.concat("day-",doc.day,"-");
        }
        if(doc.agent){
            fileName = fileName.concat(doc.agent);
        }

        if(fileName !== this.BASENAME) return fileName;
        return uniqid();
    }
}