import json, csv
with open("amazon_fa.csv", "w") as fw:
    with open("fa-IR.jsonl", "r") as f:
        writer = csv.writer(fw)
        for l in f.readlines():
            row = json.loads(l)
            writer.writerow([row['intent'], row['utt'], row['annot_utt']])


