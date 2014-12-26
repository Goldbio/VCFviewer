## Written by JC
## Last modification: 08/18/2014
## Powered by Geference Inc.

## Will generate JSON formatted VCF files
## $python Annovar_VCF_annotation.py XX, YY, ZZ

import sys
import os
root_dir='/var/www/VCFviewer_server/';
annovar_server_dir='/var/www/ANNOVAR_SERVER/';
Annovar_dbdir = root_dir+"vcf_bin/humandb/"

def merge_annotation(s):
	avoutput = root_dir+"vcf_bin/temp_files/" + s + ".avoutput"
	# merging "./Annovar/output/" + s + ".variant_function " & "./Annovar/output/" + s + ".exonic_variant_function "
	var_anno = open( annovar_server_dir+"temp_files/" + s + ".variant_function", "r").read().split("\n")
	exon_anno = open(annovar_server_dir+"temp_files/" + s + ".exonic_variant_function", "r").read().split("\n")
	exon_anno_dic = dict()
	for t in exon_anno:
		temp = t.split("\t")
		if len(temp)<2: #line without proper information
			continue
		if temp[1] == "unknown":
			continue
		exon_anno_dic[temp[0]] = temp[1] + "\t" + temp[2]
	rs = open(avoutput, "w")
	key_index=1
	for t2 in var_anno:
		temp_key = "line" + str(key_index)
		key_index = key_index + 1
		temp = t2.split("\t")
		if len(temp)<2: #line without proper information
                        continue
		if exon_anno_dic.keys().count(temp_key) == 1:
			temp.insert(2, exon_anno_dic[temp_key])
			#Sanity check
			check_anno1_gene = exon_anno_dic[temp_key].split("\t")[1].split(":")[0]
			check_anno2_gene = temp[1].split(";")[0]
			if check_anno1_gene != check_anno2_gene:
				1;
				#print "#### Check if merging the following two annotations is OK #####"
				#print check_anno1_gene
				#print check_anno2_gene

		else:
			temp.insert(2, "NA\tNA")

		#reduce anno (09/17/2013) due to JJ's request
		temp[1] = temp[1].split(";")[0].split("(")[0].split(",")[0]

		print >>rs, "\t".join(temp)
	rs.close()
	#os.system("rm "+annovar_server_dir+"temp_files/" + s + ".variant_function")
	#os.system("rm "+annovar_server_dir+"temp_files/" + s + ".exonic_variant_function")
	os.system("rm "+annovar_server_dir+"temp_files/" + s + ".log")
	os.system("rm "+root_dir+"vcf_bin/temp_files/" + s + ".avinput")

	
merge_annotation( sys.argv[1] )
	

