<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <h2 class="mb-4">訂單詳細資訊</h2>

        <!-- 訂單基本資訊 -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>訂單編號:</strong> {{ order.id }}</p>
                <p><strong>訂購日期:</strong> {{ order.orderDate }}</p>
                <p><strong>訂單狀態:</strong> {{ order.status }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>收件人:</strong> {{ order.recipient }}</p>
                <p><strong>聯絡電話:</strong> {{ order.phone }}</p>
                <p><strong>配送地址:</strong> {{ order.address }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 訂單商品列表 -->
        <div class="card">
          <div class="card-body">
            <h5 class="card-title mb-4">訂購商品</h5>
            <div class="table-responsive">
              <table class="table">
                <thead>
                <tr>
                  <th>商品名稱</th>
                  <th>單價</th>
                  <th>數量</th>
                  <th>小計</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in order.items" :key="item.id">
                  <td>{{ item.productName }}</td>
                  <td>{{ item.price }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.price * item.quantity }}</td>
                </tr>
                </tbody>
                <tfoot>
                <tr>
                  <td colspan="3" class="text-end"><strong>總計:</strong></td>
                  <td><strong>{{ order.totalAmount }}</strong></td>
                </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import orderService from '@/services/order.service'

export default {
  name: 'OrderDetailView',

  setup() {
    const route = useRoute()
    const order = ref({
      id: '',
      orderDate: '',
      status: '',
      recipient: '',
      phone: '',
      address: '',
      items: [],
      totalAmount: 0
    })

    const getOrderDetail = async () => {
      try {
        const orderId = route.params.id
        const response = await orderService.getOrderById(orderId)
        order.value = response.data
      } catch (error) {
        console.error('獲取訂單詳細資訊失敗:', error)
      }
    }

    onMounted(() => {
      getOrderDetail()
    })

    return {
      order
    }
  }
}
</script>

<style scoped>
.table th {
  background-color: #f8f9fa;
}

.table td, .table th {
  vertical-align: middle;
}

.text-end {
  text-align: right;
}
</style>
