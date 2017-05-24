import pandas as pd
from flask import jsonify, render_template, request
from flask import Flask
app = Flask(__name__,template_folder=".")
import os
from os import path
import data
import operator

@app.route('/config')
def config():
    return jsonify(data.getMeta())
    
@app.route('/')
def main():
    meta=data.getMeta()
    default={}
    quotes=[]
    for quote in meta:
        quotes.append(quote)
    return render_template("index.html", quotes=meta, default=default)

@app.route('/timeseries')
def timeseries():
    symbols=request.args.get("symbols",[])
    meta=data.getMeta()
    days_to_show=int(request.args.get("days",20))
    sym_dict=None
    if symbols:
        symbols=symbols.split(',')
        sym_dict=data.toFrontend(days_to_show)
    else:
        return jsonify({'values':[]})
    simul_dict={}
    for quote in meta:
        if quote['RealQuote'] not in sym_dict.keys():
            continue
        if quote['RealQuote'] in symbols or len(symbols)==0:
            simul_dict[quote['DisplayQuote']]=sym_dict[quote['RealQuote']]
    return jsonify(simul_dict)
    
@app.route('/table')
def table():
    quotes=data.getMeta()
    days_to_show=int(request.args.get("days",20))
    dd=data.toFrontend(days_to_show)
    for quote in quotes:
        sym=quote['RealQuote']
        if sym not in dd.keys():
            continue
        quote['price']=int(dd[sym]['values'][-1]['dailyViewcount'])
        quote['open']=dd[sym]['meta']['open']
        quote['high']=dd[sym]['meta']['high']
        quote['low']=dd[sym]['meta']['low']
        try:
            quote['change']=quote['price']/float(quote['open'])
        except:
            quote['change']=0
        quote['last_datetime']=dd[sym]['values'][-1]['date']
    quotes=sorted(quotes, key=lambda x: x['price'],reverse=True)
    return jsonify(quotes)
    
extra_dirs = ['data/',]
extra_files = extra_dirs[:]
for extra_dir in extra_dirs:
    for dirname, dirs, files in os.walk(extra_dir):
        for filename in files:
            filename = path.join(dirname, filename)
            if path.isfile(filename):
                extra_files.append(filename)
                
if __name__ == "__main__":
    app.run(extra_files=extra_files)#, host="0.0.0.0",port=80)