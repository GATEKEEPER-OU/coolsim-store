import Store from "./index.js";


// test
let a = new Store("agent",{simulation:"123"});
let s = new Store("simulation",{simulation:"123"});

// console.log(s);

// console.log("sadsad",s);

testLoop(5);

async function testLoop(num){
    for(let i = 0; i < num; i++){
        await test(i);

    }
    // await a.cleanUp({simulation:"123"});
};

async function test(i) {
    await save(a, "logs", {day:i,date: "2020-05-02"});

    let agentLogs = await read(a,"logs");
    console.log("agent logs",agentLogs.docs.length);

    let simLogs = await read(s,"details");
    console.log("simulation logs",simLogs.docs.length);
}


async function save(db,section,doc){
    return new Promise((resolve,reject)=>{
        db.save(section,doc)
            .then(val=>{
                // console.log(val);
                resolve(val);
        })
            .catch(err=>{
                console.error(err);
                reject(err);
            });
    });
}

async function read(db,section){
    return new Promise((resolve,reject)=>{
        db.readBySection(section)
            .then(val=>{
                resolve(val);
        })
            .catch(err=>{
                console.error(err);
                reject(err);
            });
    });
}