
import json , sys 


def merge_vcf_variant(merged_vcf, vcf, sample_index ):
	for var in vcf['VAR']:
		chr_pos= str(var[1]).replace('chr','')+'-'+str(var[2])
		var[0].append( sample_index)

		if chr_pos in merged_vcf:
			merged_vcf[chr_pos][4].append( var[4][0] )  # ALT 
			merged_vcf[chr_pos][5].append( var[5][0] )  # QS
			merged_vcf[chr_pos][6].append( var[6][0] )  # GQ 
			merged_vcf[chr_pos][7].append( var[7][0] )  # DP 
			merged_vcf[chr_pos][8].append( var[8][0] )  # GT 

		else:
			merged_vcf[chr_pos] = var 
	

	return merged_vcf
		


class_name = sys.argv[1]
files_to_merge= sys.argv[2:]
merged_vcf={}
field_name=[]

sample_index=0
for json_file in files_to_merge:
	vcf=json.load( open( json_file))
	
	if len(merged_vcf)==0:
		# Set dictionary for all variants 
		field_name=vcf['FIELD_NAME']
		for var in vcf['VAR']:
			CHR = var[1].replace('chr','')
			pos = var[2]

			merged_vcf[ CHR+'-'+pos ] = var

	else :
		merged_vcf=merge_vcf_variant( merged_vcf, vcf , sample_index)
	sample_index=sample_index+1


## Dumps merged VCF in JSON format
merged_json={}
merged_json['FIELD_NAME']=field_name
merged_json['SAMPLE']=class_name

for var in merged_vcf :
	try:
		merged_json['VAR'].append( merged_vcf[var] )
	except:
		merged_json['VAR']=[]
		merged_json['VAR'].append( merged_vcf[var] )
		


print json.dumps( merged_json )
