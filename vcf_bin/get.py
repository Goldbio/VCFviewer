

import simplejson
import json
from pymongo import MongoClient

# Mongodb
client = MongoClient()
db = client.clinvar
collection = db.clinvar_variantSummary
rr = collection.find(timeout=False)
result = list()
for r in rr:
        temp = (r['chromosome']+'-'+str(r['start'])+'-'+str(r['stop']), r)
        result.append(temp)

result = dict(result)
json_result = simplejson.dumps(result)
fd = open('./Clinvar.json', 'w')
fd.write(json_data)
fd.close()
