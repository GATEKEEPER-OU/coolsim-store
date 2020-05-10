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
                id:false,
                // to:"agent-logs-master",
                name:"http://localhost:5985/agent-logs",
                fields:["date"]
            }
        },
        area:{
            logs:{
                name:"http://localhost:5985/area-logs",
                fields:["name","date"]
            },
            places:{
                // to:"area-places-master",
                name:"http://localhost:5985/area-places",
                fields:["name"]
            },
        },
        place:{
            logs:{
                // to:"places-logs-master",
                name:"http://localhost:5985/place-logs",
                fields:["name","date"]
            },
            visits:{
                name:"http://localhost:5985/place-visits",
                fields:["date"]
            },
        },
        simulation:{
            agents:{
                id:false,
                name:"http://localhost:5985/agent-states",
            },
            area:{
                id:false,
                name:"http://localhost:5985/area-logs"
            }
        },
        viewer:{
            agentsLogs:{
                // from:"http://localhost:5985/agent-logs",
                id:false,
                name:"http://localhost:5985/agent-logs"
            },
            agentsStates:{
                // from:"http://localhost:5985/agent-logs",
                id:false,
                name:"http://localhost:5985/agent-states"
            },
            areaLogs:{
                name:"http://localhost:5985/area-logs",
                fields:["name","date"]
            },
            places:{
                // to:"area-places-master",
                name:"http://localhost:5985/area-places"
            },
        }
    },
));


export default STORES;