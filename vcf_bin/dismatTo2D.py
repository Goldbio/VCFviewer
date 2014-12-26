
import csv
import numpy as np
#import matplotlib.pyplot as plt
from sklearn import manifold

# Distance file available from RMDS project:
#    https://github.com/cheind/rmds/blob/master/examples/european_city_distances.csv
reader = csv.reader(open("european_city_distances.csv", "r"), delimiter=';')
data = list(reader)

dists = []
cities = []
for d in data:
    cities.append(d[0])
    dists.append(map(float , d[1:-1]))


adist = np.array(dists)
amax = np.amax(adist)
adist /= amax


mds = manifold.MDS(n_components=2, dissimilarity="precomputed", random_state=6, n_jobs=-1)
results = mds.fit(adist)

print results.embedding_
