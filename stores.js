// list of stores
// description of store for each entity type
// list of dbs to for each entity
// each db is described by
//      name of the db
//      connection, either, from, to or sync
//          - from: string with the path to the db from which it should get data
//          - to: string with the path to the db to which it should push data
//          - sync: string to the path to the db to sync with


const STORES = new Map(Object.entries(
    {
        agent:{
            logs:{
                to:"agent-logs-master",
                name:"agent-logs",
                fields:["date"]
            },
            state:{
                to:"agents-state-master",
                name:"agent-state",
                fields:[]
            },
        },
        area:{
            logs:{
                name:"area-logs",
                fields:["name","date"]
            },
            residents:{
                name:"area-state",
                fields:["name"]
            },
            places:{
                to:"area-places-master",
                name:"area-places",
                fields:["name"]
            },
        },
        place:{
            logs:{
                to:"places-logs-master",
                name:"place-logs",
                fields:["name","date"]
            },
            visits:{
                name:"place-visits",
                fields:["date"]
            },
        },
        simulation:{
            agents:{
                to:"http://localhost:5985/agents-logs",
                id:false,
                name:"agent-logs-master"
            },
            area:{
                id:false,
                name:"area-logs-master"
            },
            place:{
                id:false,
                name:"place-logs-master"
            }
        }
    },
));


export default STORES;