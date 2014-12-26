## Written by JC
## Last modification: 10/09/2014
## Powered by Geference Inc.

## Merged JSON is formatted just as single JSON file

import sys
import simplejson as json
from time import gmtime, strftime

# Function
def add_to_merged_json(temp1, temp2, merged, meta):
	temp_int = list()
	for k in range(0,len(temp1)):
		if meta[k] == 'sample_index' or meta[k] == 'GQ' or meta[k] == 'QUAL'  or meta[k] == 'GT' or meta[k] == 'ALT' or meta[k] == 'DP':
			temp_int.append(temp1[k] + temp2[k])
		elif meta[k] == 'exonic_consequence_detail':
			continue
		else:
			if temp1[k] == temp2[k]:
				temp_int.append(temp1[k])
			else:
				if set(temp1[k].split(":")) == set(temp2[k].split(":")):
					temp_int.append(temp1[k])
				else:
					if len(set(temp1[k].split(":")) & set(temp2[k].split(":"))) !=0:
						temp_int.append(temp1[k])
					else:
						print "Error!! merging not identical variants: "
						print "==="
		merged.append(temp_int)
	return(merged)
	

def comparePos(temp1, temp2):
	temp1[1] = temp1[1].replace('chr','')
	temp2[1] = temp2[1].replace('chr','')
	if temp1[1]=="X" or temp1[1]=="Y":
  		temp1_CHR = ord(temp1[1])
	else:
		temp1_CHR = int(temp1[1])
	if temp2[1]=="X" or temp2[1]=="Y":
		temp2_CHR = ord(temp2[1])
	else:
		temp2_CHR = int(temp2[1])
	if temp1_CHR > temp2_CHR: #temp[1]: CHR, temp[2]: POS
		return(1)
	elif temp1_CHR < temp2_CHR:
		return(-1)
	else:
		if temp1[2] > temp2[2]:
			return(1)
		elif temp1[2] < temp2[2]: 
			return(-1)
		else:
			return(0)


def make_merge_JSON(json1, json2):
	i1 = 0; i2 = 0
	temp1 = json1[i1]; temp2 = json2[i2]
	merged = list()
	while( temp1 != None or temp2 != None ):
		if temp1 == None :
			merged.append(temp2)
                        i2 += 1
                        try:
                                temp2 = json2[i2]
                        except IndexError:
                                temp2 = None
		elif temp2 == None :
			merged.append(temp1)
			i1 += 1
                        try:
                                temp1 = json1[i1]
                        except IndexError:
                                temp1 = None
		else:
			check = comparePos(temp1, temp2)
			if check == 1:
				merged.append(temp2)
				i2 += 1
				try:
					temp2 = json2[i2]
				except IndexError:
					temp2 = None
			elif check == -1:
				merged.append(temp1)
				i1 += 1
				try:
					temp1 = json1[i1]
				except IndexError:
					temp1 = None
			else:
				merged = add_to_merged_json(temp1, temp2, merged, meta)
	                        i1 += 1; i2 += 1
				try:
       	                        	temp1 = json1[i1]
       		                except IndexError:
                                	temp1 = None
				try:
	                                temp2 = json2[i2]
	                        except IndexError:
	                                temp2 = None
	return(merged)
	

# Load JSON files       
group = sys.argv[1:]	
json_all = {}
for s in group:
	data = open(s , "r")
	json_data = json.load(data)
	meta = json_data['FIELD_NAME']
	temp_data = json_data['VAR']
	single_data = []
	for j in temp_data:
		sample_idx = group.index(s)
		j[0] = [sample_idx]
		single_data.append(j)
	json_all[s] = single_data

# Merge JSON files
if len( json_all ) ==1 :
	print  json_all[s]
else:
	for i in range(0,len(group)-1):
		if i == 0:
			merge_json_rs = make_merge_JSON(json_all[group[i]], json_all[group[i+1]])
		else:
			merge_json_rs = make_merge_JSON(merge_json_rs, json_all[group[i+1]])

	# Write Merged JSON files
	final_result = { 'FIELD_NAME': meta, 'SAMPLE':group, 'VAR':merge_json_rs}
	merge_json_data = json.dumps(final_result)
	#filename = "./merge_JSON_files/" + "__".join(group) + ".json"
	#fd = open(filename, "w")
	#fd.write(merge_json_data)
	#fd.close()
	print merge_json_data 

