import Store from "./index.js";



// test
// let a = new Store({type:"logs",simulation:"sim-123"});
let s = new Store({type:"simulations"});

// console.log(s);

// console.log("sadsad",s);


let i = 0, stop = 1000;
testLoop();
async function testLoop(){
        console.log("saving",i);
        await test(i++);

        if(i>=stop){return}
        setTimeout(testLoop,1000)
    // await a.cleanUp({simulation:"123"});
};

async function test(i) {
    // await save(a, [
    //     {day:i,message: "foo"},
    //     {day:i,message: "bar"},
    //     ]);
    await save(s, {id:i+"-stuff", day:i,message:"lots of stuff"});
    // let agentLogs = await read(a);
    // console.log("agent logs",agentLogs);

    // let simLogs = await read(s);
    // console.log("simulation details",simLogs);

    // await s.cleanUp();
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