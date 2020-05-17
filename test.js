import Store from "./index.js";


// test
let a = new Store({type:"logs",simulation:"sim-123"});
let s = new Store({type:"details",simulation:"sim-123"});

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
    await save(a, [
        {day:i,message: "foo"},
        {day:i,message: "bar"},
        ]);
    await save(s, {day:i,message:"lots of stuff"});
    let agentLogs = await read(a);
    console.log("agent logs",agentLogs);

    let simLogs = await read(s);
    console.log("simulation details",simLogs);
}


async function save(db,doc){
    return new Promise((resolve,reject)=>{
        db.save(doc)
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

async function read(db){
    return new Promise((resolve,reject)=>{
        db.read()
            .then(val=>{
                resolve(val);
        })
            .catch(err=>{
                console.error(err);
                reject(err);
            });
    });
}