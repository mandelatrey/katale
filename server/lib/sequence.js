import Counter from '../models/Counter.js';

/** 
 * 
 * @param {string} name
 * @param {import("mongoose").ClientSession} [session]
 * @returns {Promise<number>};
*/ 

export async function nextSeq(name, session) {
    const doc = await Counter.findByIdAndUpdate(
        name,
        { $inc: { seq: 1}},
        { new: true, upsert: true, session },
    );
    return doc.seq;
}