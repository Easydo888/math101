const http = require("http"),
    url = require('url'),
    qs = require('querystring'),
    mathjax = require("mathjax-node"),
    yuml2svg = require('yuml2svg');

mathjax.start();

const app = http.createServer((req,res)=>{
    let queryObj = qs.parse(url.parse(req.url).query),
        tex = queryObj.tex,
        yuml = queryObj.yuml,
        theme = queryObj.theme,
        word = queryObj.word,
        stroke = queryObj.stroke ? queryObj.stroke : 0,
	    color = '#' + queryObj.color,
        fcolor = queryObj.fcolor ? queryObj.fcolor : '000',
        bcolor = queryObj.bcolor ? queryObj.bcolor : fcolor,
        scolor = queryObj.scolor ? queryObj.scolor : fcolor,
        swidth = queryObj.swidth ? queryObj.swidth : 0,
        errFn = (msg)=>{
            res.writeHead(404,{'Content-type':'text/html;charset=utf-8'});
            res.write(msg);
            res.end();
        },
        successFn = (result)=>{
            res.writeHead(200,{'Content-type':'image/svg+xml;charset=utf-8'});
            res.write(result);
            res.end();
        };
    
    if(yuml){
        yuml2svg(yuml,{isDark:theme === 'dark'}).then(v => {
            successFn(v);
        }).catch(e => {
            errFn('Yuml formula is wrong!');
        });
    }else if(tex){
        mathjax.typeset({
            math:tex,
            format:'TeX',
            svg:true
        },data => {
            if(theme === 'dark'){
                data.svg = data.svg.replace(/fill="currentColor"/g,'fill="#ffffff"');
            };
            if(color){
                data.svg = data.svg.replace(/fill="currentColor"/g,'fill="' + color + '"');
            };
            successFn(data.svg);
        })
    }else if(word){
        const fs = require('fs')
        fs.readFile('bishun_data/' + word + '.json','utf8',function(err,dataStr){
            data = JSON.parse(dataStr)
            dataSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" version="1.1"><g transform="translate(5, 40.15625) scale(0.0390625, -0.0390625)">'
            if(stroke){
                for (var i = 0; i < stroke; i++) {
                    dataSvg = dataSvg + '<path d="' + data.strokes[i] + '" style="fill:#'+ ((stroke - i > 1) ? bcolor : fcolor) + ';stroke:#' + ((stroke - i > 1) ? bcolor : scolor) + ';" stroke-width = "' + swidth + '"></path>'
                }
            }else{
                for (var i = 0, l = data.strokes.length; i < l; i++) {
                    dataSvg = dataSvg + '<path d="' + data.strokes[i] + '" style="fill:#' + fcolor + ';stroke:#' + scolor + ';" stroke-width = "' + swidth + '"></path>'
                }
            };
            dataSvg = dataSvg + '</g></svg>'
            successFn(dataSvg);
        })
    }else{
        // 请通过`tex`参数传入LaTeX公式，或使用`yuml`参数传入`yuml`表达式。
        errFn('Please pass LaTeX formula via `tex` parameter or `Yuml` expression using `yuml` parameter.');
    };
});
app.listen(80);