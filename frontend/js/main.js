const { createApp } = Vue;

createApp({
    data() {
        return {
            // ✅ LINKED TO YOUR LIVE BACKEND
            API_URL: 'https://backendnova.onrender.com', 
            
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
        searchQuery(newQuery) {
            this.performSearch(newQuery);
        }
    },
    computed: {
        cartTotalItems() {
            return this.cart.reduce((total, item) => total + item.qty, 0);
        },
        // ✅ FIXED MATH: Calculates Price * Qty
        cartTotalPrice() {
            return this.cart.reduce((total, item) => total + (item.price * item.qty), 0);
        },
        sortedLessons() {
            let sorted = [...this.lessons];
            const [key, order] = this.sortOption.split('-');
            
            sorted.sort((a, b) => {
                let valA = a[key];
                let valB = b[key];
                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }
                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
                return 0;
            });
            return sorted;
        },
        // ✅ FIXED VALIDATION
        isCheckoutEnabled() {
            return this.validName && this.validPhone && this.cart.length > 0;
        },
        validName() {
            // Allows letters and spaces
            return /^[A-Za-z\s]+$/.test(this.checkoutName);
        },
        validPhone() {
            // Allows numbers only
            return /^[0-9]+$/.test(this.checkoutPhone);
        },
        sortAscending() {
            return this.sortOption.endsWith('-asc');
        }
    },
    methods: {
        async fetchLessons() {
            try {
                const res = await fetch(`${this.API_URL}/lessons`);
                this.lessons = await res.json();
            } catch (e) { console.error("Fetch error:", e); }
        },
        async performSearch(query) {
            try {
                const endpoint = query ? `${this.API_URL}/search?q=${query}` : `${this.API_URL}/lessons`;
                const res = await fetch(endpoint);
                this.lessons = await res.json();
            } catch (e) { console.error("Search error:", e); }
        },
        addToCart(lesson) {
            if (lesson.spaces > 0) {
                const item = this.cart.find(i => i.lessonId === lesson._id);
                if (item) {
                    item.qty++;
                } else {
                    this.cart.push({ 
                        lessonId: lesson._id, 
                        subject: lesson.subject, 
                        location: lesson.location, 
                        price: lesson.price, 
                        qty: 1 
                    });
                }
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
                    this.message = "Order Submitted Successfully!";
                    this.cart = [];
                    this.checkoutName = '';
                    this.checkoutPhone = '';
                    this.cartVisible = false;
                    this.fetchLessons(); 
                } else {
                    this.message = "Order Submission Failed.";
                }
            } catch (e) { this.message = "Server Error."; }
        },
        toggleCart() { 
            this.cartVisible = !this.cartVisible; 
        },
        toggleSortOrder() {
            const [key, currentOrder] = this.sortOption.split('-');
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            this.sortOption = `${key}-${newOrder}`;
        }
    },
    mounted() {
        this.fetchLessons();
    }
}).mount('#app');