var fs = require('fs');
fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    var value = [];
    var y = [];
    var finalText = [];
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        for( var j = 0; j<texts.length; j++) {
            var R = texts[j]["R"];
            value[j] = R[0]["T"];
            y[j] = texts[j]["y"];
//            console.log("y " +y[j] +" " + "value " +value[j]);
        }
    }
    for(var i = 0;i<value.length-2;i++){
        if(y[i] === y[i+1]){
            finalText[i] = value[i] + value[i+1];
        }else{
            finalText[i] = value[i];
        }
    }
    console.log(finalText);
});