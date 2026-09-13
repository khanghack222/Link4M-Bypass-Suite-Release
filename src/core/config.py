# -*- coding: utf-8 -*-
# Link4M Security Engine - Protected Native Module: config
# Protected by polymorphic bytecode encryption & anti-tamper integrity checks.
__author__ = "khanghack222"
__version__ = "4.2.0"
__obfuscated__ = True
__integrity_hash__ = "9319b275a42109448d868039fbb6cd9268da8fcf948f29205ce1853a36212029"

import sys, os, zlib, marshal, base64

# Try loading high-speed native C machine code (.pyd) if available
_pyd_loaded = False
try:
    _dir = os.path.dirname(os.path.abspath(__file__))
    if _dir not in sys.path:
        sys.path.insert(0, _dir)
    import config as _pyd_mod
    for _attr in dir(_pyd_mod):
        if not _attr.startswith("__"):
            globals()[_attr] = getattr(_pyd_mod, _attr)
    _pyd_loaded = True
except (ImportError, AttributeError):
    _pyd_loaded = False

if not _pyd_loaded:
    try:
        _0xK = base64.b85decode("$bW-8%lWI6uYk-huMk)iKVpoe3S2OKvaa;?(oLOq")
        _0xP = base64.b85decode("u%#wymX)|ox<0#5LkXA6wt<M|h<wZ*1f%5Vz7>u@>{$ckPu~JA3xTKJ;|%MX`2Q7<%WiGfXeq!4SW?UvrQQyf!F(yev3gAUC>rb=#EQ)_x*EFo=38}A$PBn*VJ&Qdg?mQf`Q8~YGHbW3*#37@m%~s005OR`uO>craCGM!2;sB48t~A(IST(=bnRcRvX-3GoE%g$eGgwCo4tKJ$qA!6BCCtd^9@ek8k!cimJs==v9zsI<rP}j@VN#C=fKZyt~ys~d#e6SsC3@}@9=x}AAE)&cPKWbqVH~FNeJx?>{Nj-YVBBMAkXJ0J(Y}~D+-V@MS<nT<nKMSG1Qres@^L_gCxwb1z8`8uNOHW3piwfZ+<&4T4CDlMv?cX4eIb34Ao+p20>K-#zm@Wgu2b)geVw>O#3DBj_kIZZDkkh$j~?D2`ik#o)K*z%`>rI1OyO7{3|`0g}iILCjckzPkWQ!Z^V*!pVZiVWzYWmQU+qqhT1FUvsV`_b@+%u@}Wa`atY0{=V_Is_{aH^DBZCko2k`VQqPx*$<w&Y1AM25<N5lC4@xaaU*FxYH2N|5xA@h3*S?Z-kpuMXIid}4jt<Ce#3yB%H;xA~J&+2<a?pUoEJuS)+7CA1b-y48kg_v&0erZ232v2D;r>Z#wQf&-!`F$rtEoskz|+VPig)^AlAwWtlN!v>T>Xaoj~TN7H3S?h06>uiU+6RVLo0VMYk0n5js}$$eY{86fp7>$(lQOdb+6guO?C(~5ih5*jX_o`XUcygb`-MHagTE0lcgKH`ZrXn%Ul5>T1+Otuz7A}t56u3qIv0zB!(mTWAKjp9y)DnyoPl`Rev^xW7-a8_rzFhS_qK+MqaX~U%7dvbp^5eOgvzH4%6iLyM#0=V_)UZ0wNfBV~$ExZ_3(Pz2jyIC`N6dqAHF{TI08~B&a`k;jSj9bFcWrj9(kOfNbY1XC_S!<B{-X-^4B<R5PnEV6fJWx&svTyc|+Gjqrc4h(h_TnrfEa1%1PQw_y@a6(WMk-N%qbA|Oy!9QVE8TMUwKG4rLs-sKghPbp`rO%bOQeqc|F)ZGWx%<FBJTK?hB*wA(f>u2+hb4zklNpK=RuI*Z*=Y^VU>LI<|^2aqpUbzK<d=*NuR~Tuv4c-IMCct@jHoI&J>S=@W^~2_=_tBB*Pu%!saumrL;$$=BH}@lzE+6Fk8eOI3QSz?hq`7DO3x!k^-aRtIyCDv+E^qo{r#{@&46E(g?bt(D;p2w-C$7$bNi>H}Q>D~-A*V>9N(c6rC}^V~o)d-QP#&ChfK>a__jW7xK%UH!GhWhaWe@ez$)g}!OC@kd(c6NPx*6xsCoG{vTm)Q3&F*|zJu{tfDt2v3;P0uOH29WvuC>0dV>VX0-sksHZZmgtq7xsceiw{Jpo7#WE<_;eZxVR}?gJu3t%KsCli=~oWC>>!%gEo!dZ0|da7jF6n8S9yC<I?-6ba4voE6O1!JE2y3}5w0@@mexi(#V&KfNotx*q61jt>{T@S*GR^Hci*j11I&_97?{H;I_la4|RQ+$P+!dMUW_EAcfWx(><fXgGzf_{@J1(U!hL!h~-R-+@d+j<yxQMVUJ7$<Fh1RSHgnW`<@%OJm#58w^}_lU;<!oGI$=3aLMg-T;J4{c!l<Fwv(rvLqv*#o*6S%+-Hu1aAB;PI2uqV~6A3uGmt5A|e<`Vr3@yAEII368+H38iD@6@_uvt<Faa!_#Tu?RCD%11~NCO^8L%~OI4VFaOVKhtecOC7_GumzrSFWv?)l6`cXdwF0n;%A8u>XdvF3%VKkm!m5~|;9+|P^ErQ;gor5014`z%DCZRx`4*i8yLM)f|;A#^y!a_ssG7m;Lntl56fkwKxwMjO=(9Vq0XM9`i{j0+PP6~=U4ra{ABlvZT%Z>uRRkHI-Kz>fI$*eXXBqJ&kN88W?8ecB+C;dfS_|QKHIJ!5_MbLApCRl3t5}c7QT~6Ynj4u*1osmjJ$UL5eTGJA1p&Y9%_q8-aPk%$teaqq0<H64ZLR(!U3%eJ`HWD=v&*gm^fHz;km3Y*hVz|Q;kbqh<@lk)MP|8JL&$FvGaez8<IP<yW9I}+JgJ7}&+?whum<m|i#2)O*BM=nLXUOBI!fwWMNwY(qa4=!lX{UUg%z2n@H~<~c{IroxZwKPG?^Qaa@$>K^Vbn~Mqsb%CYd|#WriQj{4h#j>k6VuTjckXUsHbuE3~>me&Y`(I8lJTdW%{HgzOP~<eWW$uLN-O1VYCR2$7aR^_R`Y2oY>}qq%rnY20uQy1HEt!X_-J|55o142D@Mg0hLrCyLB)IK*pSikx>2Fv|Ux;h*vufN>xM=AG7Pi^9FBmxzNiqkfY*@RTy)w%_88R#lv$tRR?EasdEy}7<1vDs1R<!S>UW{ok=1~@IYBBfW(cME3s97k>^t>ljC6SNwPzpD*o;;7rrZg8!XXCk??y;@}q&dLQ>hYyPpI+3+rC&A~->Sag8-45|oVnan;4&-HrkK8?-8DDVLvQa9Iv1`d{&^13Y5}FOHr!8migM=|Qis)<NFXV4PHIC2rA75ofa_a(;Y%K?df2{7`M*K%`2Rd@Arg{A%qVJ7i><H5w$~qipsS0ja`vMoW4tOKFX3t?(=O5l4KLqdv4f=jPX5Hx4VAJ%cI%Q$5ULBe2*Jr2!22E;Y8@(Zv9LbbjvxaJr5LkYbC3WHyB=$)JTJ981`sOO<<^6xhBeJ(3^ceHaphD*$XRmO}*!o;O|%4Zq{mzNeXqrr#a@LOK6Y{5AO~E6a1jkQ=pqpLhlb?1G3v6kdW<{M7Yvelh>X1PO81vCdPE8C}D1{*cc#oLfWW;@p6guc>jnw>#8h")
        _0xD = bytes([_b ^ _0xK[_i % len(_0xK)] for _i, _b in enumerate(_0xP)])
        _0xR = zlib.decompress(_0xD)
        _0xC = marshal.loads(_0xR)
        exec(_0xC, globals())
    except Exception as _err:
        print("[!] Security Integrity Check Failed on config:", _err, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if "main" in globals():
        globals()["main"]()
    elif "run" in globals():
        globals()["run"]()
