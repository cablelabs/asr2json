var fs = require('fs');
//var exports = module.exports = {};


module.exports.jsonCon = function(fileName){
    var text = "";
    var json = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    getJsonData(json);

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
        var content = "" ;
        var considered = false;
        for(var i = 0;i<value.length;i++){
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
                content = "\n";
            }
        }
        content = " ";
        content = decodeURIComponent(finalText);
        content = content.replace(/,/g,"");
        text = text + content;
    }
    var writablestream = fs.createWriteStream('parsedText');
    writablestream.write(text);
    writablestream.end();
//    fs.writeFile('parsedText.txt',text, function (err){
//        if(err){
//            return console.log(err);
//        }
//    })
}