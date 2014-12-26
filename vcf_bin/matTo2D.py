import json
import sys
import re
import numpy as np
from sklearn import manifold

def read_json(file):
	vcf = json.load(open(file))
	return [ var[1]+'-'+str(var[2])  for var in vcf['VAR'] ]


def get_distance(set1, set2):
	intersection=set.intersection( set(set1) , set(set2) );
	union=set.union( set(set1) , set(set2) );
	similarity = len(intersection) /float(len( union))
	distance = 1.0 -similarity
	return distance


######### MAIN ########

mat_json = json.loads(  sys.argv[1]  )

'''
mat_json=json.load( open( sys.argv[1] )) 
'''



mat={}
head=''
file_seq=[]
for i in mat_json:
	pair=i['pair'].split('___')
	dis= i['dis']

	if head == '': 
		mat[ pair[1] ]=[0]
		head=pair[0]
		file_seq.append( pair[1])
	elif head != pair[0] :
		file_seq.append( head )
		mat[ head ].append(0)
		head=pair[0]

	for vcf in pair :
		try:
			mat[vcf].append(dis)
		except:
			mat[vcf]=[ dis ]
  

mat[head].append(0)
file_seq.append( head )


dists=[]
vcfs=[]
for i in file_seq:
  vcfs.append(i)
  dists.append( mat[i] )


adist = np.array(dists)
amax = np.amax(adist)
adist /= amax


mds = manifold.MDS(n_components=2, dissimilarity="precomputed", random_state=6, n_jobs=-1)
results = mds.fit(adist)

print( json.dumps( dict(zip(  vcfs, results.embedding_.tolist() ) ) ))



