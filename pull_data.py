import pandas as pd
import datetime
from time import sleep
from YTCrawl.lib.xmlparser import *
from collections import defaultdict
import pytz
from bs4 import BeautifulSoup
import re
import requests
from YTCrawl.crawler import Crawler
now=datetime.datetime.now(pytz.timezone('US/Central'))
today=now.strftime("%Y%m%d")
import ssl
PREFIX_PATH="server/data/"

ssl._create_default_https_context = ssl._create_unverified_context
c=Crawler()
c._crawl_delay_time = 1.1 # set crawling delay to 1
c._cookie_update_delay_time = 1 # set cookie updating delay to 1
def songToDf(song):
    rowDate=song['uploadDate']
    dates=[]
    df=pd.DataFrame(song)
    for i in range(len(df)):
        dates.append(rowDate)
        rowDate+=datetime.timedelta(days=1)
    #df['uuid']=uuid
    del df['uploadDate']
    df['date']=dates
    return df
def visitNode(uuid):
    Link = 'http://www.youtube.com/watch?v='+uuid
    r = requests.get(Link)
    soup = BeautifulSoup(r.content, "lxml")
    title=soup.find('span',class_="watch-title").get("title")
    rels=[]
    for order,side_item in enumerate(soup.find_all("a",class_="content-link")):
        rel_title=side_item.get("title")
        rel_link=side_item.get("href").split("v=")[1]
        rels.append((order+1,rel_title,rel_link,))
    return pd.DataFrame(rels,columns=["order","title","uuid"])

def update():
    videos = visitNode('CTFtOOh47oo')
    NODES_TO_PARSE = 100
    for i in range(NODES_TO_PARSE):
        print(i)
        try:
            uuid = videos.iloc[i]['uuid']
        except:
            break
        videos = videos.append(visitNode(uuid), ignore_index=True)
        videos = videos.drop_duplicates(subset="uuid")
    videos.to_csv("server/data/meta.csv", index=False, encoding='utf-8')
    videos['uuid'].to_csv("server/data/links/list", index=False)
    print("batch crawling now")
    c.batch_crawl(PREFIX_PATH + "links/list", PREFIX_PATH + "historical")
    import os
    files = [os.path.join(dp, f) for dp, dn, filenames in os.walk(PREFIX_PATH + '/historical/data') for f in filenames]

    for file_ in files:
        with open(file_) as f:
            try:
                song = parseString(f.read())
                df = songToDf(song)
                uuid = file_.split('\\')[-1]
                df.to_csv(PREFIX_PATH + '/historical/current/' + uuid + '.csv', index=False)
            except:
                print('err for ', file_)

if __name__=="__main__":
    update()