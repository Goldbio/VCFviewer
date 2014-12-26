## Written by JC
## Last modification: 06/18/2014
## Powered by Geference Inc.

## Will generate JSON formatted VCF files
 
## $python VCF_JSON_convert.py ./VCF_files/XX.vcf ./VCF_files/YY.vcf ./VCF_files/ZZ.vcf

import sys
import simplejson
import json

# Function
def convert_VCF_JSON(lines):
	data_list = list()
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
				Sample_idx = Format_idx + 1
				continue
			except:
				print "ERROR: missing informatoin in the VCF"
                		pass
		CHR = temp[CHR_idx]
		POS = temp[POS_idx]
		REF = temp[REF_idx]
		ALT = temp[ALT_idx]
		QUAL = temp[QUAL_idx]
		GQ = temp[Sample_idx].split(":")[temp[Format_idx].split(":").index("GQ")]
		DP = temp[Sample_idx].split(":")[temp[Format_idx].split(":").index("DP")]
		GT = temp[Sample_idx].split(":")[temp[Format_idx].split(":").index("GT")]
		temp_dic = {"CHR":CHR, "POS":POS, "REF":REF, "ALT":ALT, "QUAL":QUAL, "GQ":GQ, "DP":DP, "GT":GT}
		data_list.append(temp_dic)
	return(data_list)
		

def put(data, filename):
	try:
		json_data = simplejson.dumps(data, indent=4, skipkeys=True, sort_keys=False)
		fd = open(filename, "w")
		fd.write(json_data)
		fd.close()
	except:
		print "ERROR writing", filename
		pass


# Strat Main 		
files = sys.argv[1:]
for file in files:
	# Convert
	try:
		lines = open(file, "r").read().split("\n")
	except:
		print "ERROR reading", file
		break
	data = convert_VCF_JSON(lines)

	# JSON dump
	file_name = file.split("VCFjsonS3/")[1].split(".vcf")[0]
	json_file = "./VCFjsonS3/" + file_name + ".json"
	put(data, json_file)
	
	
