# ★正本 / うさぎ表示調整.js の再生成スクリプト(2026-08-14 Fable5)
# 一軍うさぎ(img\usagi)が増減・差し替えになったら、これを実行するだけで
# ずかんの顔サイズ統一データ(うさぎ表示調整.js)が作り直される。
#
# 仕組み(あご基準):
#  - 顔 = 画像内部の透明な「穴」。一番大きい穴と横位置が半分以上重なる穴
#    (メガネ・帽子で分割された顔パーツ)を合併して1つの顔として測る。
#    天使の羽など顔の外の穴は横位置判定で除外される。
#  - fw=顔幅/画像幅, cx=顔中心x, by=あご(顔の下端), ty=頭の上端(不透明ピクセル全体の最上部)
#  - K=標準頭高(耳先→あごが顔幅の何倍か)。中央値で算出(2026-08-14時点 1.774)
#  - 測定失敗(fw<0.4 or >0.95)は fw=0.70 のフォールバック+byをKから推定(上限0.97)
#  - ずかん側(うさぎのへや.html)はこのデータで全カードのあごを同じ高さに置く
#
# 実行: python うさぎ表示調整_再生成.py   (要 numpy, scipy, Pillow)
import os, json, io
import numpy as np
from PIL import Image
from scipy import ndimage

USAGI = os.path.join(os.path.dirname(__file__), r'..\..\img\usagi')
OUT   = os.path.join(os.path.dirname(__file__), 'うさぎ表示調整.js')

ids = [f[:-4] for f in os.listdir(USAGI) if f.endswith('.png') and not f.startswith('_')]
out = {}
for n in sorted(ids):
    im = Image.open(os.path.join(USAGI, n+'.png')).convert('RGBA')
    W,H = im.size
    a = np.array(im)[:,:,3] > 10
    ys,_ = np.where(a)
    ty = ys.min()/H
    inv = ~a
    lab, k = ndimage.label(inv)
    border = set(lab[0,:]) | set(lab[-1,:]) | set(lab[:,0]) | set(lab[:,-1]); border.discard(0)
    sizes = ndimage.sum(inv, lab, range(1,k+1))
    inner = [(i,sizes[i-1]) for i in range(1,k+1) if i not in border]
    f = {'ar': round(H/W,4), 'ty': round(float(ty),4)}
    if inner:
        big = max(inner, key=lambda t:t[1])[0]
        by_,bx_ = np.where(lab==big)
        bx0,bx1 = bx_.min(), bx_.max()
        keep=[big]
        for i,s in inner:
            if i==big or s < sizes[big-1]*0.15: continue
            hy,hx = np.where(lab==i)
            ov = min(bx1,hx.max()) - max(bx0,hx.min())
            if ov > 0.5*(hx.max()-hx.min()):
                keep.append(i)
        mask = np.isin(lab, keep)
        hy,hx = np.where(mask)
        f['fw'] = round(float(hx.max()-hx.min())/W,4)
        f['cx'] = round(float((hx.max()+hx.min())/2)/W,4)
        f['by'] = round(float(hy.max())/H,4)
    out[n] = f

Ks = [ (v['by']-v['ty'])*v['ar']/v['fw'] for v in out.values() if 'fw' in v and 0.5<v['fw']<0.95 ]
K = float(np.median(Ks))
for n,v in out.items():
    if 'fw' not in v or v['fw']<0.4 or v['fw']>0.95:
        v['fw']=0.70; v['cx']=0.5
        v['by']= round(min(v['ty'] + K*0.70/v['ar'], 0.97),4)
out['_K']=round(K,4)
io.open(OUT,'w',encoding='utf-8').write('window.USAGI_FIT = '+json.dumps(out,ensure_ascii=False)+';\n')
print('ok', len(out)-1, '匹 / K=', round(K,3))
