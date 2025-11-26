const { createApp } = Vue;

createApp({
    data() {
        return {
            // CHANGE THIS TO YOUR RENDER URL ONCE DEPLOYED
            API_URL: 'http://localhost:3000', 
            
            lessons: [],
            cart: [],
            searchQuery: '',
            sortOption: 'subject-asc',
            checkoutName: '',
            checkoutPhone: '',
            cartVisible: false,
            message: '',
        };
    },
    watch: {
        // Triggers backend search when typing (Requirement met)
        searchQuery(newQuery) {
            this.performSearch(newQuery);
        }
    },
    computed: {
        cartTotalItems() {
            return this.cart.reduce((total, item) => total + item.qty, 0);
        },
        cartTotalPrice() {
            return this.cart.reduce((total, item) => total + (item.price * item.qty), 0);
        },
        sortedLessons() {
            let sorted = [...this.lessons];
            const [key, order] = this.sortOption.split('-');
            sorted.sort((a, b) => {
                let valA = a[key], valB = b[key];
                if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
                return 0;
            });
            return sorted;
        },
        isCheckoutEnabled() {
            const nameRegex = /^[A-Za-z\s]+$/;
            const phoneRegex = /^[0-9]+$/;
            return nameRegex.test(this.checkoutName) && phoneRegex.test(this.checkoutPhone) && this.cart.length > 0;
        }
    },
    methods: {
        async fetchLessons() {
            try {
                const res = await fetch(`${this.API_URL}/lessons`);
                this.lessons = await res.json();
            } catch (e) { console.error(e); }
        },
        async performSearch(query) {
            const endpoint = query ? `${this.API_URL}/search?q=${query}` : `${this.API_URL}/lessons`;
            const res = await fetch(endpoint);
            this.lessons = await res.json();
        },
        addToCart(lesson) {
            if (lesson.spaces > 0) {
                const item = this.cart.find(i => i.lessonId === lesson._id);
                if (item) item.qty++;
                else this.cart.push({ lessonId: lesson._id, subject: lesson.subject, location: lesson.location, price: lesson.price, qty: 1 });
                lesson.spaces--;
            }
        },
        removeFromCart(item) {
            const lesson = this.lessons.find(l => l._id === item.lessonId);
            if (lesson) lesson.spaces += item.qty;
            this.cart = this.cart.filter(i => i.lessonId !== item.lessonId);
        },
        async checkout() {
            if (!this.isCheckoutEnabled) return;
            
            const orderPayload = {
                name: this.checkoutName,
                phone: this.checkoutPhone,
                lessonIDs: this.cart.map(i => ({ lessonId: i.lessonId, qty: i.qty })),
                total: this.cartTotalPrice
            };

            try {
                const res = await fetch(`${this.API_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                });
                if (res.ok) {
                    this.message = "Order Submitted!";
                    this.cart = [];
                    this.checkoutName = '';
                    this.checkoutPhone = '';
                    this.cartVisible = false;
                    this.fetchLessons(); // Refresh spaces
                } else {
                    this.message = "Submission Failed";
                }
            } catch (e) { this.message = "Server Error"; }
        },
        toggleCart() { this.cartVisible = !this.cartVisible; }
    },
    mounted() {
        this.fetchLessons();
    }
}).mount('#app');