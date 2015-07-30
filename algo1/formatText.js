var fs = require('fs');
fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    getJsonData(json);
});

function getJsonData(json){
    var value = [];
    var y = [];
    var finalText = [];
    var k = 0;
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        for( var j = 0; j<texts.length; j++) {
            var R = texts[j]["R"];
            value[k] = R[0]["T"];
            y[k++] = texts[j]["y"];
        }
    }
    k = 0;
    var tillValue = 0;
    var content = " " ;
    var considered = false;
    for(var i = 0;i<value.length-2;i++){
        if(y[i] === y[i+1]){
            tillValue++;
            considered = true;
        }else{
            if(considered == true){
                for(var j=i-tillValue; j <= i;j++){
                    content = content + value[j];
                }
                tillValue = 0;
                considered = false;
            }else{
                content = content + value[i];
            }
            finalText[k++] = content;
            content = "\n ";
        }
    }
    content = " ";
    content = decodeURIComponent(finalText);
    fs.writeFile('parsedText.txt',content, function (err){
        if(err){
            return console.log(err);
        }
    })
}