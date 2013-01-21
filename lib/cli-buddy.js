//requires azure and async modules
var util = require('util');
var async = require('async');
var child_process = require('child_process');
var path = require('path');
var cli = require('../node_modules/azure-cli/lib/cli');

/**
* Invokes one or more commands on the CLI
*
* @param {object} [command]                           Either a command like 'site list' or an array of commands
*                                                     with optional callbacks of the function(err,result)
* @param {function(err, results)} [complete]          Completion callback fired when all commands are complete
*/
exports.invoke = function (command, complete) {  
  if( Object.prototype.toString.call(command ) === '[object Array]' ) {
    if (complete === undefined || complete === undefined) {
      throw "Completion callback is required";
      return;
    }

    handleArray(command, complete);
  }
  else {
    handleSingle(command, 
      function(err, result) {
        complete(err, [result]);
      } 
    );
  }
}

function handleArray(commands,callback, results) {
  commands = Array.prototype.slice.call(commands);
  var results=[];

  async.forEachSeries(commands, 
    function(item, callback2) {
      if (item === undefined) 
        callback2()

      handleSingle(item.cmd,
        function(err, json) {
          results.push(json);
          if (err) 
            callback2(err);
          else {
            if(item.callback != null)
              item.callback(callback2, json);
            else
              callback2();
          }
        }
      );
    },
    function(err) {
      callback(err,results);
    }
  );
}

function handleSingle(command, callback) {
  var azurejs = path.resolve(__dirname,'..','node_modules', 'azure-cli', 'bin', 'azure.js');
  var cmd = 'node ' + azurejs + ' ' + command + ' --json';
 
  //http://stackoverflow.com/users/374773/dandean
  if (!(Object.prototype.toString.call(callback) == '[object Function]')) {
    throw "Callback must be provided";    
  }
  
  exports.exec(cmd, callback);
}


/**
* Calls the CLI and returns a JSON result object
*
* @param {object} [cmd]                               Commands to be passed to the CLI
* @param {function(err,result)}  [callback]           Callback containing either an error or the resulting JSON object
*/
exports.exec = function exec(cmd, callback) {
  child_process.exec(cmd, {encoding:'ascii'}, function(error, stdout) {
    if(error)
      callback(error)
    else
    {
      var json;

      if (error)
        callback(erorr, null);

      if (stdout == '')
        json=null;
      else {
        console.log(stdout);
        json = JSON.parse(stdout);
      }

      callback(undefined,json);
    }
  });
}




