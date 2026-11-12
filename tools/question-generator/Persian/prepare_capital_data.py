import csv, random, json, re
from itertools import permutations



capitals = []
countries = []
capital_country = {}
country_capital = {}

with open("capital_persian.csv") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        capitals.append(row[1])
        countries.append(row[0])
        capital_country[row[1]] = row[0]
        country_capital[row[0]] = row[1]

print(capitals)

data = []
perm = list(permutations([0, 1, 2, 3]))

for capital in capitals:
    ind = [i, j, k] = random.sample(range(0, len(countries) - 1), 3)
    data.append([capital, capital_country[capital], countries[i], countries[j], countries[k], "capital_country",
                 "The country with the following capital:", ""])

for country in countries:
    ind = [i, j, k] = random.sample(range(0, len(capitals) - 1), 3)
    data.append(
        [country, country_capital[country], capitals[i], capitals[j], capitals[k], "capital_country", "The capital of:",
         ""])

random.shuffle(data)
# question, answer, choice1, choice2, choice3
with open("Capitals.csv", "w") as f:
    writer = csv.writer(f)
    for d in data:
        writer.writerow(d)
