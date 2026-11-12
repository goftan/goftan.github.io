import csv,json

dict_en_fa = {}
dict_fa_en = {}


with open("dict.csv") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        dict_en_fa[row[1]] = row[0]
        dict_fa_en[row[0]] = row[1]


with open('common_words_persian.csv', 'w') as f1:
    writer = csv.writer(f1)
    with open('persian-wikipedia.csv') as f:
        reader = csv.reader(f)

        for r in reader:
            if r[0] in dict_en_fa.keys():
                writer.writerow([r[0],dict_en_fa[r[0]]])
