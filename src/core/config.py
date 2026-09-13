# -*- coding: utf-8 -*-
# Link4M Security Engine - Protected Native Module: config
# Protected by polymorphic bytecode encryption & anti-tamper integrity checks.
__author__ = "khanghack222"
__version__ = "4.2.0"
__obfuscated__ = True
__integrity_hash__ = "36008bc8f9679feda9de4c29464b0a9878d4a9af8cada0b0484f2b6a6e3ba8da"

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
        _0xK = base64.b85decode("<*h_MK2i<5<9YG@fKG}GpEZ|lnIb{Zi_X(KAENp4")
        _0xP = base64.b85decode("op;e|b3PvX_va|$`=i%4yF0QVyDI(_E`ydE#}?n4t>NS}HyAGoTX;GV4%3H%NUzG~iKlCNvx<TdQTNpNh~pI&cDKcee<{ABG+bOp4y8SF<52|Pqnvj2v(rhjM;F@9rDbAbm`Vy8`yuoT$_iliX!kC_3(-?K3p)Qp7o{ieC(9LIZxwyG;KU)6vBvlI#;?b_(8DA##!1*-DaIoYpIicI`RAO-gv;BMilgrf?)rvXH~(TaQ2czage75(S9{pmCKNyqRVz<pF2}sXLIRf%iyC8j`K``}h89o>R31Mzlj3^FsZb63jSDxes4`VAFN6??Q^g)$`q<^hi^<eDO%7K`R3gevC6w`hABZF}vQj+{c`hK-(axm0QgSGgh;viVIke{ZEnL4cWF}p3%S+;si3QK`USTN7S9XPo0xrpT&%Zs)gDsajm;J-*bF5^@Dy5Q-gu_boGFEQf3h@))pP`hJa@%MbdoY)Rv;PiCQSaK1hy9mqS7zLUYRs6)QQ1eT%Iu!39nQ(>TEa=ja|xg|G&HoAUN6g=T-e(FiEX<*JNzCQ<aE%@J#u^TM{!J6)VvXFi-g{W!CN*5RCQHV2&j5T1_Fr*2WSXqDZ{lWyP4N>TE>wwQ<SsLDj;G_S;Ji^KL|+EV)#c+Wf|n}{-9N7^>*0kzdnQWBTz9d8oBSZ@V+|}nV%=BpzN5&>hn&aDc62iVGcL|!Y213D<e%S)I*KJO+*n}PD;{yON*1jDR(kVRPFITZ#Y5@!y@V?I2n9fwl^-F$INgaz^!?OwbSc45Y1$zvNfX$iT5}~jZQa;#0O(BGvNG1gbIWwYdHsqNr}Wr2^H8h^~GXN*v(yWeD_vBtB1JL6|INE=-Djj8V=YK#|-Bkbu%E1h5rAfbrB#Ffmwwg?+L-BivMcps~7G0N6$pj|5Hz<c_hU!xnG2B6H63KV&!`8Yv_N!cg%7lVMB8Hvqo>mz{Cp|^WF(ZEk7#Nh&7zvO%(rM(`fkB!(<JX)>zj9Nl&tgC#c_`EOwBV?ia<aFqLHGcgS>H5sz}Uly=7UCZiP7Qcyd$lMwA!q^rNzbCBt$PZ%IX*c>zb!S^CQ)!(A9;Zq<lqrHb!$>5_oa;<ZBT;{#B-%z205ITa@3G2lCrHV@_+*3z~x=yos&9A1T_XVt5FNJt{&IuB7zNphbMJ_R0zFRGi3o|Qc4+(?i&b~QmbQ?D?4O`tz(kN7Po6C*kuGcZGaZyQBT4|qaOePL`LQ&{H{!K_W%QofJ<xlY7?VOukl75q3@e3Rf(&hySFeOb%Rl?^AfYlOKt}=inO?(^zM_Q=G(t#WF%fR5TY9;u{%KQcj*H30xRd~q|?-+X9ImQs*N!V~VFhD^u?a5}=I9`yMCfNf3=j|;eZ5Odz_8#hAJbXCML9!PaG}KQGJq?Ko^n8r8_(&e`jOs_67FS?&nOjrk9^aq#Svp8W^-WEibDJuOCkLDCa<m@6p?ri?s76aRk^R{5172mX_mS`un(+sTKoDObMLw5{sOBU)LADVrOJM(%OMag5)THZ$AX?$@m6k;1M7TF?zrebS%f;Kf4)!aegl$ES4id=sSc+6!wblG*q3~&3e}55mgb1Zb@p4suMD&E9tE3vzbkVfcOOzAfs6C_^Whp|X5AOxQXY0&qoa+vbUPHV`R|W}cG2H}D_|xeS6p1}y+#^<0{9t@LhhPTQL!mMM#T=UF-B8$=Jb@Z!CIFDPS#mduy|;t1e}>A~{;1%rkJ*l21(IL=FjsVK!aQ@1t%ySu{dv7&jcFDa-BHax>r0hW#PtMpy&8U^7sym7zctg<rkQMt+Ft_y(H<46+lT(7m0k`0!QL)UHDdWmMFq~<I51ieBxn3r{lY6fHFL=f24dN?5T6)6Q=Ss#CjsFNCudvfC??Dryi7J7Iq6lO(=6H<ie9pDk}FcV%zubKf-1|9$>~F_HITMGlX(-URh=<^SIm-OQ7^)SHOS;+gn$Mx3u{CP;y(09*`(~WoWZWb;jkH7g{r1H&<)jqRpk")
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
