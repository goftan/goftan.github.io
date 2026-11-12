import csv, random, json
with open("persian-wikipedia_filtered.csv", 'w') as fw:
  with open("persian-wikipedia.csv") as f:
    reader = csv.reader(f, delimiter='\t')
    writer = csv.writer(fw)
    for row in reader:
        if int(row[1]) > 100:
            writer.writerow(row)
