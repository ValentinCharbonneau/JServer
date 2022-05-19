const fs = require('fs');
module.exports = {
    log:function log(event) {
        let now = new Date();
        let newLog = (now.getMonth() + 1).toString()+'/'+now.getDate().toString()+'/'+now.getFullYear().toString()+' '+now.getHours().toString()+':'+now.getMinutes().toString()+':'+now.getSeconds().toString()+'   '+event+'\n';

        fs.appendFile("../../log/jserver.log", newLog, (err) => {
            if (err) console.log(err);
        });
    }
}