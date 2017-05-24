import pandas as pd
import datetime
from time import sleep
from collections import defaultdict
import pytz
from datetime import timedelta
import numpy as np
from os import listdir
from os.path import isfile, join

now=datetime.datetime.now()
PREFIX_PATH="data/"
directory=PREFIX_PATH+'historical/current/'
files = [f.split('.')[0] for f in listdir(directory) if isfile(join(directory, f))]#[:100]
print(files)
global_dfs={f: pd.DataFrame() for f in files}
def updateQuotes():
    global global_dfs
    dfs=global_dfs
    for f in files:
        df=pd.read_csv(PREFIX_PATH+'historical/current/'+f+'.csv')
        df['dailyViewcount']=df['dailyViewcount'].astype(int)
        df['dailyViewcount']==df['dailyViewcount']
        df['date']=pd.to_datetime(df['date'])
        df['ordinal']=df['date'].apply(lambda x: x.toordinal())
        dfs[f]=df[['dailyViewcount','date','ordinal']]
    global_dfs=dfs
    return dfs
print(updateQuotes()[files[0]].head())
def toFrontend(days_to_show=20):
    global global_dfs
    dfs=global_dfs
    dd=defaultdict(dict)
    #dfs=updateQuotes()
    for sym in global_dfs:
        DAYS=dfs[sym]['date'].dt.normalize().unique().tolist()[-days_to_show:]
        LAST_TRADING_DAY=dfs[sym]['date'].dt.normalize().unique()[-1]
        quotes=dfs[sym][dfs[sym]['date'].dt.normalize().isin(DAYS)]#change to range for speedup
        OPEN=quotes['dailyViewcount'].iloc[0]
        HIGH=max(quotes['dailyViewcount'])
        LOW=min(quotes['dailyViewcount'])
        dd[sym]['meta']={'open': OPEN,'high': HIGH,'low': LOW}
        dd[sym]['values']=list(quotes[['dailyViewcount','date','ordinal']].to_dict(orient='records'))
    return dict(dd)
   
def clean_text(row):
    # return the list of decoded cell in the Series instead 
    return ''.join([r.decode('unicode_escape').encode('ascii', 'ignore') for r in row])

def getMeta():
    df=pd.read_csv(PREFIX_PATH+'meta.csv')
    df.sort_values(by="title",inplace=True)
    df=df[df['uuid'].isin(global_dfs.keys())]
    df['RealQuote']=df['uuid']
    df['DisplayQuote']=df['title'].apply(clean_text)
    return df.to_dict(orient='records')