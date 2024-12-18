<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import ProductCard from '@/components/product/ProductCard.vue'
import { productApi, cartApi } from '@/utils/axios'

export default {
  name: 'HomeView',
  components: {
    ProductCard
  },

  setup() {
    const router = useRouter()
    const store = useStore()

    const currentSlide = ref(0)
    const carouselSlides = ref([
      {
        image: '/images/carousel/slide1.jpg',
        caption: '新品上市'
      },
      {
        image: '/images/carousel/slide2.jpg',
        caption: '限時特惠'
      }
    ])

    const categories = ref([])
    const featuredProducts = ref([])
    const newProducts = ref([])

    const onSlideStart = () => {}
    const onSlideEnd = () => {}

    const goToCategory = (categoryId) => {
      router.push(`/products/category/${categoryId}`)
    }

    // 修改後的獲取數據函數
    const getProducts = async () => {
      try {
        const [categoriesRes, featuredProductsRes, newProductsRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getProducts({ featured: true }),
          productApi.getProducts({ sort: 'newest' })
        ])

        categories.value = categoriesRes.data
        featuredProducts.value = featuredProductsRes.data
        newProducts.value = newProductsRes.data
      } catch (error) {
        console.error('獲取數據失敗:', error)
        store.dispatch('app/setError', {
          message: '獲取數據失敗',
          type: 'error'
        })
      }
    }

    const addToCart = async (product) => {
      try {
        await cartApi.addToCart({
          productId: product.productId,
          quantity: 1
        })
        store.dispatch('cart/updateCartCount')
        store.dispatch('app/showNotification', {
          type: 'success',
          message: '成功加入購物車'
        })
      } catch (error) {
        store.dispatch('app/showNotification', {
          type: 'error',
          message: '加入購物車失敗'
        })
      }
    }

    onMounted(async () => {
      await getProducts()
    })

    return {
      currentSlide,
      carouselSlides,
      categories,
      featuredProducts,
      newProducts,
      onSlideStart,
      onSlideEnd,
      goToCategory,
      addToCart,
      getProducts
    }
  }
}
</script>
