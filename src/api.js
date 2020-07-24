const express = require('express')
const zookeeper = require('node-zookeeper-client')
const Long = require('long')
const router = express.Router()

let zkConnections = {};


router.post('/zk', async (req, res) => {
    switch(req.body.act){
        case 'connect': {
            let client = await zkClient(req.body.address)
            zkListChildren(client, '/', res)
            break
        }
        case 'list': {
            let client = await zkClient(req.body.address)
            zkListChildren(client, req.body.path, res)
            break
        }
        case 'getData': {
            let client = await zkClient(req.body.address)
            zkGetData(client, req.body.path, res)
            break
        }
        case 'addNode': {
            let client = await zkClient(req.body.address)
            zkAddNode(client, req.body.path, res)
            break
        }
        case 'removeNode': {
            let client = await zkClient(req.body.address)
            zkRemoveNode(client, req.body.path, res)
            break
        }
        case 'setData':
            let client = await zkClient(req.body.address)
            zkSetData(client, req.body.path, req.body.data, res)
            break
        default:
            res.send('')
    }
})

async function zkClient(address){
    let client = zkConnections[address]
    if(client){
        let state = client.getState()
        if(state === zookeeper.State.SYNC_CONNECTED){
            return Promise.resolve(client)
         }else{
             client.close()
             delete zkConnections[address]
             return await zkClient(address)
         }
    }else{
        client = zookeeper.createClient(address)
        zkConnections[address] = client
        console.log('new connetion: %s', address)
        client.connect()
        client.on('state', state => {
            console.log(state)
        })
        return new Promise((resolve, reject) => {
            client.once('connected', ()=>{
                resolve(client)
            })
        })
    }
}

function zkGetData(client, path, res) {
    client.getData(path, (err, data, stat) => {
        if(err){
            console.log('%s', err)
        }
        let s = {}
        stat.specification.forEach(i => {
            s[i.name] = i.type === 'long' ? Long.fromBytes(stat[i.name]).toString() : stat[i.name] 
        });
        res.send({data: (data && data.length > 0) ? data.toString('utf8') : '', stat: s})
    })
}

function zkListChildren(client, path, res) {
    client.getChildren(path, (err, children, stat) => {
        if(err){
            console.log('%s', err)
        }
        res.send(children)
    })
}

function zkRemoveNode(client, path, res) {
    client.remove(path, -1, (err)=>{
        if(err){
            console.log('%s', err)
            res.send('fail')
        }else{
            res.send('success')
        }
    })
}

function zkAddNode(client, path, res){
    client.create(path, null, null, zookeeper.CreateMode.PERSISTENT, (err) =>{
        if(err){
            console.log('%s', err)
            res.send('fail')
        }else{
            res.send('success')
        }
    })
}

function zkSetData(client, path, data, res){
    client.setData(path, Buffer.from(data), -1, (error, stat) => {
        if (error) {
            console.log(error.stack);
            res.send('fail')
        }else{
            res.send('success')
        }
    })
}


module.exports = router
