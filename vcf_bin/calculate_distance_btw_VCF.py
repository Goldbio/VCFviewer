import json
import sys
import re
import numpy as np
from sklearn import manifold

def read_vcf(file):
	vcf=  open( file )
	variant_set=[]
	for line in vcf:
		if re.match( '^(#|\n)', line ):
			continue 
		else:
			line = line.split('\t')
			variant_set.append(line[0]+'-'+line[1] )
	return variant_set

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

vcf_file_dir='/data/temp_user_data/'+sys.argv[1]+'/'
new_file=sys.argv[2]
project_files=json.loads(sys.argv[3])
mat_json = json.loads(  sys.argv[4]  )

'''
vcf_file_dir='/data/temp_user_data/gold@geference.com/'
new_file='AC54_Genome_final.vcf'
project_files=['AC566_Exome_final.vcf']
mat_json=[]
'''

new_vcf = read_vcf( vcf_file_dir + new_file)
number_variants_new_vcf= len(new_vcf)
distSet=[]

if len( project_files ) > 1 :
	for vcf_file in project_files:
		if vcf_file == new_file:
			continue
		#vcf =read_json(vcf_file_dir+ vcf_file.replace('.vcf','.json')  )
		vcf = read_vcf( vcf_file_dir+ vcf_file );
		distance_set={}
		distance_set[ 'pair'] = new_file+'___'+vcf_file 
		distance_set[ 'dis' ] = get_distance( new_vcf, vcf)
		mat_json.append( distance_set )
		distSet.append( distance_set )


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

	mds= dict(zip(  vcfs, results.embedding_.tolist() ) )
	print json.dumps({'numVCFVariants':number_variants_new_vcf,'dist':distSet, 'mds': mds})

else:
	print json.dumps({'numVCFVariants':number_variants_new_vcf})

