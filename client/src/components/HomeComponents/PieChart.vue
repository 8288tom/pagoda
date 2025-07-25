<template>
    <Pie v-if="pieData" :data="pieData" :options="options"></Pie>
</template>

<script>
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(Tooltip, Legend, ArcElement)

export default {
    name: 'App',
    components: {
        Pie
    },
    props: ['elasticData'],
    data() {
        return {
            colorArray: ['rgb(255, 99, 132,0.5)', 'rgb(255, 159, 64, 0.5)', 'rgb(255, 205, 86, 0.5)', 'rgb(75, 192, 192, 0.5)', 'rgb(54, 162, 235, 0.5)'],
            options: {
                plugins: {

                    legend: {
                        position: 'bottom'
                    }
                }
            }
        }
    },
    computed: {
        pieData() {
                 return{
                labels:['Company F','Company G','Company H','Company I','Company J'],
                datasets:[{
                    data:['11001', '400000','123470','870000','134345'],
                    backgroundColor:this.colorArray
                }]}
            // if (this.elasticData) {
            //     const companyLabels = this.elasticData.map(item => item.name)
            //     const renderValues = this.elasticData.map(item => item.val)
            //     return {
            //         labels: companyLabels,
            //         datasets: [{
            //             data: renderValues,
            //             backgroundColor: this.colorArray
            //         }],
            //     }
            // }
            // else return false

        }
    },
    created() {
        this.colorArray.sort(() => 0.5 - Math.random())
    }
}
</script>