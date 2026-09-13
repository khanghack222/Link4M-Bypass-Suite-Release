# -*- coding: utf-8 -*-
# Link4M Security Engine - Protected Native Module: config
# Protected by polymorphic bytecode encryption & anti-tamper integrity checks.
__author__ = "khanghack222"
__version__ = "4.2.0"
__obfuscated__ = True
__integrity_hash__ = "729567ac8df478d9058bd91bc837a0ca752c627e73c4c29574c7974bca64adab"

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
        _0xK = base64.b85decode("-;HuL&s6K8kHC14pS4G&witvOudaPn2;Y5PSmln>")
        _0xP = base64.b85decode("r&s4-f;jl)n_i)h<X9S>k`|#?ji$not&%u?fKjNrm%-9M#vaKRH^H-f5hzM4VS?F_zbjY&Fq<rN7O<n)vcn@Chp{7<6OcE~E2oj~Cx|Wt)!jH+AdT3N^prl3eK+jHRAYpE^z(yu<k~r+<0o^0UV9Qnh`{|^Onr!AErk)~*3I)l1FZDb|3B<KnCs+$@FV*^Q__l5fex>K6Xq2JZd&Abm0lI4n=lqVqmKN1*mk<!wC>DM7rP6Nz6Do?rhPugO0CIaO3;GJ2kNi1bdIZ)2n)>|zUsNAyf$V6r5M>L|6B8=wyVHWq$VWVp1x_Std+j)6oP4g!1&Y6de1T@A-CQoOW6nH47uV6DFhg|F+-DTK519=>+X`Vqjb)U<jUHjCQmC-1aYiIQmSF~NLozv&O*4*WI-Onrf_4IZkIq6&_wWMssMydp>h9i@V&~dZQ|vwzT<rV!%&FAW=NW{fLd8QTlRZyO}wiIFz%o)7O1VRz1^W_reHdq26YjnP9ll}<H3#FD?;^e+0*BvG)~tP4iti%uPH5sFkw@ZmX>yu644EA()jF1zGKyt05&^!?wluQdV)BZt>V9GOOBZQA%$r$Fpjm1gn6a{ZiK=Kfw|#$tH5_GKP@_=HQTS`aPCfC350Z3;pyosB3_fu#DHUL1aLm~(}xP4JgfYKGnD+p#xe(%8jgw2=d17M(9?LT*wL6t4Y#pv-Q7Bi0uEkW;?J>1&Q-rY2@R!MajT`t*m2ZSI8=C3aKn$M>JRx*4wXROH70=gfQtt{`i)PHMAZ!^e01%|t<G+vpxP@kyTS_(M;6Ugbf=4CzACaTnm^%|B`{4T7VZ_D+~{#R?m=Pn|K|85?7+|RFO9Lt8Q;qGcDGS}*!L>5Tply}vvR{B_5hA{#vbxM)hYL`d-;s^$F5|QSTu=v)_z>kPpJ8|I!-DGR19NnSj9}_n(mpQ8+H3mez?C-nrnQq_DDC9aL=bAYIt4rvK6Y;yb>8fztM5H+@HWd|8>N5f5VOpq`7g$Ycc1y)Hm~{!IOgf8*%+H4s^d9y<63R5HBcJ(Lt5c)K{8zo{Ndxf|d`tBcZ7&$LIc4=-M$!<5QkBVnU8e<ofV*^T3rdgR7NkFkdv;z^iO3ITw+lKWF%PCY$9<n-nmnfNq6yJgGpvo4h49Fn+br=Oh6Ih$Qd2#y_7v`5aoVF%unZ{tspQq6e@9YvB5sBzDd_<fLfv7}_I->5xW@OL2c+t8aOAAfJa9U8*IP*I-*g{kqvuW?o)}s@v>*s9vR201f&MzF&-GFW!LQeDCyqwplLIEh8>K3Oj2feR`hGBZvL!r+I0@b>1~$<Ixp;;lo<p)@f&Ts9z2G1Lh{wxZaj2T=~dc@-nM`5p#p?5LG{gWc-6bDp1CK%s$*y&3fL^EeoD>D=&hi6d;;@!tk&$ds(oR%dIfIEO%CaXkE4Ya%L8rM!|*c++bepMHdzfq!u-aHS=lVn_RMASwO8Q{X|im9HpoR-n`>vtbIES!vXO{0(s!7lExA+u(0<sC)sxRRE1Mm{fYSU7S`Q$7KiG91OGrwh2V^UI>SAsVo##ao0f<sCqLVOZU$)CHpEf_=C>YwMPDa=bq+&Toy*)4TMtPIf{6*GLS2YZ$c4Ry?|RcXUkP-s{^{f13sOY{gAl_fcW$pRVTv{HvdpR~zm%RaE~yJ@EhVr@klFQCn48OgYK$U?^N^-uUO{&Kd&X@?93ZB=sC3bk(GCjVV0{O1*M;-jxmB{-hJ*2#cMt<i_#8!rT#ls*k-#($l9JoL^nBh)-N&icN93vz`dtZwE$Ct+PBS&j${^+E#iY+x_%jCF?F+&o7Ehy_hM8Gz4?@pEv;!!_REg7lJDf58)bBV-1ON4jg>!e&SJ-bKX}%=x)&~a@OWx9iH{AiVm0=}n4`pc@P(5^f%^Af|s0(DWJ$Y^+?vq0O))I~c9KEGUrS&f@){LJT5R2tNYY+5@#LfbJ=sAyF6p)Fa%M<56?<mkQAJ71&ruS}ozlxACAqz8}Ia~")
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
