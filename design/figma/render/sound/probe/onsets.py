import struct, sys, wave
# read float32 wav (WAVE_FORMAT_IEEE_FLOAT) manually
def read(path):
    d = open(path,'rb').read()
    i = 12; fmt=None; data=None
    while i < len(d):
        cid = d[i:i+4]; sz = struct.unpack('<I', d[i+4:i+8])[0]
        if cid == b'fmt ': fmt = struct.unpack('<HHIIHH', d[i+8:i+24])
        if cid == b'data': data = d[i+8:i+8+sz]
        i += 8 + sz + (sz & 1)
    ch = fmt[1]; n = len(data)//4
    x = struct.unpack('<%df' % n, data)
    return fmt[2], [x[k::ch] for k in range(ch)]
def main():
  for p in sys.argv[1:]:
      sr, (l, r) = read(p)
      first = next(i for i,v in enumerate(l) if abs(v) > 1e-7 or abs(r[i]) > 1e-7)
      pk = max(max(map(abs,l)), max(map(abs,r)))
      import math
      print(p.split('/')[-1], 'sr', sr, 'first nonzero', first, '(%.4f s)' % (first/sr), 'peak %.2f dBFS' % (20*math.log10(pk)))

if __name__ == '__main__': main()
