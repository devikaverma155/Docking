const { default: mongoose } = require('mongoose');
const io = require('socket.io')(3001, {
    cors: {
        origin: "http://localhost:3000",
        methods: ['GET', 'POST']
    },
});

// Establish MongoDB connection
const connection = async () => {
    const URL = 'mongodb+srv://devikaverma1554:devika15@docsdata.y888lbf.mongodb.net/?retryWrites=true&w=majority&appName=DocsData';

    try {
        await mongoose.connect(URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        console.log('Connected successfully to MongoDB..');
    } catch (error) {
        console.log("Error connecting to database: ", error);
    }
};

// Define document schema
const documentSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        required: true
    }
}, { timestamps: true }); // Adding timestamps to track creation and updates

// Create Document model
const Document = mongoose.model('Document', documentSchema);

// Function to get document by ID
const getDocument = async (id) => {
    if (!id) return null;
    let doc = await Document.findById(id);
    if (!doc) {
        doc = await Document.create({ _id: id, data: "" }); 
    }
    return doc;
};

// Function to update document by ID
const updateDocument = async (id, data) => {
    await Document.findByIdAndUpdate(id, { data }).exec();
};

// Establish socket connection
connection();

// Handle socket events
io.on("connection", socket => {
    socket.on('get-document', async documentId => {
        socket.join(documentId);
        const doc = await getDocument(documentId); 
        socket.emit('load-document', doc ? doc.data : null); 
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        });
        socket.on('save-document', async data => {
            await updateDocument(documentId, data);
        });
    });
});
