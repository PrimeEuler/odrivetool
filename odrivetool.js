var odrive      = require('odrive');
var repl        = require('repl');
var util        = require('util');
var _progress   = require('cli-progress');
var shell       = repl.start({
  prompt: '> ',
  input: process.stdin,
  output: process.stdout,
  useGlobal:false
})
function PRINT(object){
    process.stdout.write('\n' +  util.inspect(object, false, 10, true) + '\n')
}
shell.context.PRINT = PRINT
shell.context.odrive = new odrive()

shell.context.odrive.on('error',PRINT)
shell.context.odrive.on('remoteObject',function(object){
    delete object[''] //remove endpoint 0
    
    //prints a copy of the javascript object's initialized state
    //-marshalling-
    //object getters trigger an async fiber request to query all endpoints state
    //PRINT(
        shell.context.odrive.unmarshal(object)
    //    )
    //attach marshalled object
    shell.context.odrv0 = object
    //delay for the async get request to set the local object state
    //self.fibre.latency ~.5ms
    setTimeout(function(){
        PRINT('Connected to ODrive ' + object.serial_number  + ' as odrv0.')
    },100)
    
})
shell.context.odrive.fibre.on('connect',function(object){
    //PRINT('Fibre connected to ODrive on USB.')
})
shell.context.odrive.fibre.on('error',PRINT)
shell.context.odrive.fibre.on('payload.start',function(length){
    PRINT('Fibre connected to ODrive on USB.')
    var b2 = new _progress.Bar({
        barCompleteChar: '#',
        barIncompleteChar: '_',
        format: ' |- Read JSON Definition : {percentage}%' + ' - ' + '||{bar}||',
        fps: 5,
        stream: process.stdout,
        barsize: 30
    });
    b2.start(100, 0);
    shell.context.odrive.fibre.on('payload.update',function(length){
        b2.setTotal(length + 512);
        b2.update(length)
    })
    shell.context.odrive.fibre.on('payload.complete',function(length){
        b2.setTotal(length);
        b2.update(length)
        b2.stop()
    })

})
//shell.context.odrive.fibre.on('tx',PRINT)
shell.context.odrive.fibre.start()
