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
        _0xK = base64.b85decode("k_mL$^O7MHlv`S*d6^tJ3fZ|$#sdGn9%<5eFc|XZ")
        _0xP = base64.b85decode(">eJDTuKqI3f#ogRm4MUXgF3wrL?Q#;sAR%wTtMN`wlDMoceIGEFj_HHHHELY%|sx12QZ=*#O~&bx(B0%|ET$J`4^)=ilN$Z{*$OS@iF+@c0_eIN}N;QDp}X_J6oG)y%5Y{!Ud1J<l^&y?L|VmTb+PEtoE<XO><G_DgqGtFp4=lAuC2V?}NK>K~`!<e#lc4FxzszpIR`n!OM!;@nR{u8E_p&C4>s|FCimeT23};9dnD`2S7DOs?YJ@->XILmEpnSts}Z&ozLp%Bd)YIv%8?Jm3>(?_?el7abstV*N+#Zyks0m6?D?U@ykPBht0OXr__p6zM0BW3BMBvkp;cZRjr7fFybm>V@dYlr~g6>jVn~402eI_e)@eTHZf+A+FT~IGx}iZ3L9mqD1GZ}W_@=T7LC#rwud|$R=$B?9$9nCJdmj>Qct4bVf2^M=23surd`T>z1QJ99NV#Fnex~2T7RdWQ;HY7$q3kXuu~0R+^pOHi#(mJP9q-5Bq#?}N3!@^D>qtXQ~=)|%81^u!QUdkYNQ<t@(3<K)%D}0)<Vx=!xZ9(^BDUg)~{Y@?T#Xv@6{Ods@P&@?<+}NyS4p<2zjbnn@J(R-^FEDD5iHM6f6nN;nbjOqc&tEr3nU~%_4WUrKz*n1FI(c?-;n4`@91>kaFIz7Fvuvzs%2zUj9x(Ki%qGzNqPH)o(=R4R4mKJDUfNiD7ruc925ZrzUZtBEhqppXn$_+Xnxj>RE?BPIOOboBvE6B$Sd{K_8jx%MDqsltJA>EBS>7tIm-;!R*2z9o0n-Z}$^cd?%r$2bVq+KrDtGe(=;ETbl%WCE@$vY7a4QV8jD#uY|#-TLXUPxLyBj94JLWXVUW~PTnVQnzbZQJ801nciQ{w&zQqP;CFZEIrzP@SD{eZhB)wn{?93mmyx@omc4j$h;JGC1N%ufDcKJtv^0@BySH(tv9Adu)+)t}6Pn@S`1Fmvg5|j!;C15@gm>7wwkzp7Udz3JuhFA4$s-KD8>TeF_jm1Bhp}g(8cW*NCoC&#jfK`i1W1r661&=F<L*HxuSCd&Bo?@B?6!?o_b~e$jCZBt?Q28eCpkP$-;7k=t0hgY^qZ|k-|i6W(fTV^Bu;T|YXUH6uuFw;``=GE?~80ee725}4$$U`(XthJBTAx#!fK=dgMv4v-qY`w05M#2ZGqHt7IbcVA%-(<hkNSJkpfZ`$J?9Ka{3fbS#)6`bQukWpH)^=H*kAWJ5dL9)L63<>+k_U<@2G#vGBX-d(po{a%_AT6SFm|NSeXVWu>W{ObRp;Td@s$qRXQLX(%O(U1Wb!@_4q;ovbu#<Y2dYc1I`=i|dEUzELyRmzayc1y~pG5v}{dHfHUx0YjslV(W2k&+%|KJhGU>G(~`wns}8aMa&w_b_$RR8~+spqfEBLLc|2gPu7hy$(9B!Tw?8%@DoWwtSJbRMe+%ZRGqnggu{93_FSTA#$!7%`S39LH-uxtB;$&dzS@@V^W)@s7TM0SY+86Ms@EJB%Q$g@x7R}SAggRW0y3>Uyl?m`aN+tsn0(h`afiaif@MQ%Q{xjRE=4;$<SmP;4%(p4b4F^;Y~y+^AMecz@uhk6Zqe8Xun!_`e%S6N*HV+VKboRNetd<0P~XUE=4%ei#;a~>=2+t!ho2Tn3BCZ3U=ms8<~x(W6bBmDTkL6Gl>@{J^s8KCSKbp5)BLU<zB=|n_|%b6s0f4_+u7g}!^Hx?g8H&=Gl>F0KBELI=aRk+lCp0@_U(9YAjU}2gk<&}VxSDC&*}>8;_r&Fv#CvAnI&z)J3?u>t@@CMB|;}}`wN=3s5mPq!#G3Bie_dI?5OI*7+PQu*a4Zd`I*&b<c0zjug1?CO&E1}8IBM#GMnQ<JqoM}#lT5{b<rHK*zbtt7DGT{2hh!a`E}LCqAMXjliI=g97v#&d;ms>%+_k&5=L;fG>-7dlzkCGr-d9id@h|HD)$?&W|ed)TBcSWs49Q01Y%J{_7pVcLrKKEt;55lcNED_Mi6&jHAsstci?Es$K}`un$;7WEwB=b+Ciu%trK1ySz}e7MhPAs#Og{xoRo^6V|0zXlhsw@VueluB-tJ>xVt2Z3KOmdt+8z~2tXqWkJmClg`JE!m>4mYaoEWoOY8Sszb-hj`NFM-^j^{sP;<AyjZ%##wIj_!$(VYgS`XS7bwFqRUi$$9YS?+LqRS&&Z4TjS*BWqokj(pbH>#c~7%2S^FC~EIsibS=5@<xOpYd987(lXqS>J*V{Jl_*AX}D~sbkY?Xm2@{s`wZ+;piWnGw-*8H>rOSJz(~O*BlTGj?M+|jF?kMJ(t^5RtP$A(jm;~az4(HBxrp}C66myjBEbdT>ULe`QKF|FL#d)pS6VCZEWq}lBk45&ibXYovT|YmA+%DF^&Yr5*0SO+Om3n6WZVZsyxM_MQS9&d<k}U=Aa?)yLk=s`FXzC%Z7}s%E${jd5KRrZ5BWgK2U1~?q-fa-AWUv@WJD3E2A<w<>iZeAaA_m{~p^(MdCZaHUU0tulq%d&D-&&K-?}W(JCb{?V3nmwiOUY5Y^<R-8p>Y-nm-yqf?3RrY4#>c+bEVNAYI1D&wg#4&PC8`9$j=53A6a<NU4X96gQAa{>qJmMgt;$IdvomW6@TE4Ub*o5>9n-_}Kt2}?VK8{1Nmp4ysn_`LG)<bE}jxF8_I+<mBvayR4^K0tEJ@yidRCy-7nog6>0A!Ccq@yyU6(cd%<$yEct%r)}trd-sGHe_{QXfEBPlVm6tj%P5DQ1aiU$(|fj%56fMrxT2a*I6FQ!q>)m$#1}zvTra3sLoefQ=2><Ln}0w#`{IJr-0ROG*!g8ni51(du1D=")
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
