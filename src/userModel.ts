import mongoose from 'mongoose'
export type UserType = Document & {
    username: string;
    email: string;
    password: string;
};
const userSchema = new mongoose.Schema<UserType>({
    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    }
}, { timestamps: true });
const User = mongoose.model<UserType>('User', userSchema);
export default User;