// list of stores
// description of store for each entity type
// list of dbs to for each entity
// each db is described by
//      name of the db
//      connection, either, from, to or sync
//          - from: string with the path to the db from which it should get data
//          - to: string with the path to the db to which it should push data
//          - sync: string to the path to the db to sync with
//          - id:true, uses the agent id in the db name
//          - simulation:true uses simulation id in the db name

const STORES = new Map(Object.entries(
    {
        simulation:{
            details:{
                simulation:true,
                to:"http://localhost:5985/",
                name:"simulation",
                repParams:{
                    live:true,
                    retry:true,
                    batch_size:100,
                    batches_limit:5.
                    // since:"now"
                }
            }
        },
        viewer:{
            agentsLogs:{
                name:"http://localhost:5985/agent-logs"
            },
            agentsStates:{
                name:"http://localhost:5985/agent-states"
            },
            areaLogs:{
                name:"http://localhost:5985/area-logs",
            },
            places:{
                name:"http://localhost:5985/area-places"
            },
        }
    },
));


export default STORES;