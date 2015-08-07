# asr2json
asr2json is a converter that takes in the ASR PDF Spec and produces JSON.

* For more information about the converter: https://github.com/cablelabs/asr2json/wiki

##Setup

###Install Node.js

For instructions:
* https://nodejs.org/download/

###Install pdf2json module
* https://github.com/modesty/pdf2json

###Clone the repository
Open the terminal. Use the "cd" command to navigate to the desired directory. Clone the git repository (git required)

```
git clone https://github.com/cablelabs/asr2json.git
```

##Run
* As of now, the module requires the PDF to be converted to a JSON file using the pdf2json module mentioned above. This JSON file is the provided to the asr2json module which converts the file and stores the file in a directory that shares the same name as the form.

###Navigate to the asr2json directory
* cd asr2json
* node asr2json.js
