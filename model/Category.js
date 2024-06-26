const mongoose = require('mongoose');
const {Schema}=mongoose;

const categorySchema = new Schema({
    label: { type : String, required: true, unique: true},
    value: { type : String, required: true,unique: true},

},
{ timestamps: true })

const virtual=categorySchema.virtual('id');
virtual.get(function(){
    return this._id;
})
categorySchema.set('toJSON',{
    virtuals:true,
    versionKey:false,
    transform:function(doc,ret){delete ret._id;
        ret.createdAt = doc.createdAt;
        ret.updatedAt = doc.updatedAt;
    }
})

exports.Category=mongoose.model('Category',categorySchema)