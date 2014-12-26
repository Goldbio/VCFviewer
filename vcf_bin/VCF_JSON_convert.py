### Written by JC
## Last modification: 10/09/2014
## Powered by Geference Inc.

## Will generate JSON formatted VCF files
## $python VCF_JSON_convert.py XX, YY, ZZ 
#{ 
#	{'FIELD_NAME': ["samepl", "CHR", "POS", .... ]} 
#	{'VAR': [[var_info], [var_info], [var_info], [var_info]}
#}

## each variant should be sorted by location
## CHR has both integer and string so used "ord()"

import sys
import simplejson
import json
from operator import itemgetter, attrgetter
import re


root_dir='/var/www/VCFviewer_server/'

def make_annovar(s):
	avoutput = root_dir+ 'vcf_bin/temp_files/' + s + ".avoutput"
	annovar = open(avoutput).read().split("\n")
	annovar.pop()
	annovar_dict = dict()
	for anno in annovar:
		temp = anno.split("\t")
		# parse amino acid change. modified by JC upon JJ's request
		try:
			ac_temp = temp[3].split(":").pop().split(".")[1].split(",")[0]
			ac_orginal = ac_temp[0]
			ac_change = ac_temp[len(ac_temp)-1]
		except:
			ac_orginal = "NA"
			ac_change = "NA"
		temp[4] = temp[4].upper().replace("CHR","") ## modified in 10/09/2014 by JC 
		temp_key = "-".join(temp[4:7])
		temp_anno = "==".join(temp[0:4])+"=="+ac_orginal+"=="+ac_change
		annovar_dict[temp_key] = temp_anno
	return(annovar_dict)

# Function
def convert_VCF_JSON(lines, s):
	## LOC: loc_anno
	## GENE: gene_anno
	## ANNO: exonic_consequence
	## ANNO_ALL: exonic_consequence_detail
	## AA_REF: ac_original
	## AA_ALT: ac_change
	## TYPE: var_type
	## CVAR: clinical_significance
	## CVAR_DESC: clinvar_description
	## CVAR_ACC: clinvar_acc
	## CVAR_VER: clinvar_ver
	## DBSNP: dbsnp_rs_number
	meta = ["sample_index", "CHR", "POS", "REF", "ALT", "QUAL", "GQ", "DP", "GT", "LOC", "GENE", "ANNO", "ANNO_ALL", "AA_REF", "AA_ALT", "TYPE", "CVAR", "CVAR_DESC", "CVAR_ACC", "CVAR_VER", "DBSNP"]
	sample = [s]
	var_list = list()
	sort_key = list()
	for line in lines:
		temp = line.split("\t")
		if len(temp) < 2:
			continue
		if line.find("##") != -1:
			continue
		if line.find("#CHROM") != -1:
			line = line.upper()
			try:
				CHR_idx = temp.index("#CHROM")
				POS_idx = temp.index("POS")
				REF_idx = temp.index("REF")
				ALT_idx = temp.index("ALT")
				QUAL_idx = temp.index("QUAL")
				Format_idx = temp.index("FORMAT")
				Info_idx = temp.index("INFO")
				Sample_idx = Format_idx + 1
				continue
			except:
				print "ERROR: missing informatoin in the VCF"
                		pass
		# Get column index from a given VCF file
		CHR = str(temp[CHR_idx]).upper()
		CHR = CHR.replace("CHR", "")
		# Just for sorting (if CHR==character, var_list will be sorted as ['1', '10', '2', '3' ....]
		if CHR=="X" or CHR=="Y":
			sort_CHR = ord(CHR)
		else:
			try:
				sort_CHR = int(CHR)
			except: # ex)17_CTG5_HAP
				continue
		POS = temp[POS_idx]
		REF = temp[REF_idx]
		ALT = temp[ALT_idx]
		QUAL = temp[QUAL_idx]
		# Get & Set properties
		GQ = temp[Sample_idx].split(":")[temp[Format_idx].split(":").index("GQ")]
		try:
			DP = temp[Sample_idx].split(":")[temp[Format_idx].split(":").index("DP")]
		except:
			DP4 = re.search("\;DP4=(.*?)\;", temp[Info_idx]).group(1).split(",")
	                DP = int(DP4[0]) + int(DP4[1]) + int(DP4[2]) + int(DP4[3])
		GT = temp[Sample_idx].split(":")[temp[Format_idx].split(":").index("GT")]
		POS = int(POS)
		QUAL = float(QUAL)
		GQ = float(GQ)
		DP = int(DP)
		# Form JSON like list
		basic_rs = [[0], CHR, sort_CHR, POS, REF, [ALT], [QUAL], [GQ], [DP], [GT]] # data type standardication for merged_json
		clinvar_rs = annovar_clinvar_anno(CHR, POS, (POS+len(ALT)-1))
		var_temp = basic_rs + clinvar_rs
		var_list.append(var_temp)
		
	sorted_var_list = sorted(var_list, key=itemgetter(2,3))
	# remove CHR_index 
	final_var_list = []
	for v in sorted_var_list:
		del v[2]
		final_var_list.append(v)
	result = {"FIELD_NAME": meta, "SAMPLE": sample,  "VAR" : final_var_list}
	return(result)
		

def annovar_clinvar_anno(Chr, Start, Stop): #Chr: String, Start/Stop: integer
	# Annovar annotation
	temp_key = Chr + "-" + str(Start) + "-" + str(Stop)
	try:
		temp_annovar = annovar_dict[temp_key].split("==")
	except KeyError:
		temp_annovar = ["NA","NA", "NA", "NA", "NA", "NA"]
		
	# Clinvar annovation
	try:
		record = clinvar_data[temp_key]
                Type = record['type']
                Clinical_significance = record['clinicalsignificance']
                dbsnp_rs_number = record['rs_num']
                try:
                        Description = record['text']
                except:
                        Description = "-"
                Clinvar_acc = record['acc']
                Clinvar_ver = record['ver']
                rs = temp_annovar + [Type, Clinical_significance, Description, Clinvar_acc, Clinvar_ver, dbsnp_rs_number]
	except KeyError:
		rs = temp_annovar + ["NA", "NA", "NA", "NA", "NA", "NA"]
	return(rs)

	
def put(data, filename):
	try:
		json_data = simplejson.dumps(data)
		fd = open(filename, "w")
		fd.write(json_data)
		fd.close()
	except:
		print "ERROR writing", filename
		pass


# clinvar file 
clinvar_file = open(root_dir+'vcf_bin/Clinvar.txt' , "r").read().split("\n")
clinvar_file.pop()
cname =  clinvar_file.pop(0).split("\t")
var_idx = cname.index("var")
type_idx = cname.index("type")
clinicalsignificance_idx = cname.index("clinicalsignificance")
text_idx = cname.index("text")
acc_idx = cname.index("acc")
ver_idx = cname.index("ver")
rs_num_idx = cname.index("rs_num")

clinvar_data = dict()
for line in clinvar_file:
	temp = line.split("\t")
	temp_rs = {temp[var_idx]: {'type': temp[type_idx], 'clinicalsignificance': temp[clinicalsignificance_idx], 'text': temp[text_idx], 'acc': temp[acc_idx], 'ver': temp[ver_idx], 'rs_num': temp[rs_num_idx]}}
	clinvar_data.update(temp_rs)


# Strat Main 		

mail= sys.argv[1]
filename= sys.argv[2]

# Convert
try:
	vcf_file =root_dir+ 'VCFjsonS3/' + mail+'/'+filename
	lines = open(vcf_file, "r").read().split("\n")
except:
	print "ERROR reading", vcf_file

# make annovar dictionary
annovar_dict = None
annovar_dict = make_annovar(mail+'_'+filename )

# convert VCF files
data = convert_VCF_JSON(lines, filename)

# JSON dump
json_file = root_dir+'VCFjsonS3/' + mail+'/'+ filename.replace('.vcf','.json')
put(data, json_file)

