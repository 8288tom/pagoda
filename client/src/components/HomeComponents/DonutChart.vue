<template>
    <Doughnut v-if="donutData" :data="donutData" :options="options"></Doughnut>
</template>

<script>
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(Tooltip, Legend, ArcElement)

export default {
    name: 'App',
    components: {
        Doughnut
    },
    props: ['elasticData'],
    data() {
        return {
            colorArray: ['rgb(255, 75, 100)', 'rgb(54, 162, 235)', '#62d9ff', '#ff7c41', 'rgb(255, 205, 86)'],
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
        donutData() {
            if (this.elasticData) {
                const companyLabels = this.elasticData.map(item => item.name)
                const renderValues = this.elasticData.map(item => item.val)
                return {
                    labels: companyLabels,
                    datasets: [{
                        data: renderValues,
                        backgroundColor: this.colorArray
                    }],

                }
            }
            else return false
        }
    },
    created() {
        this.colorArray.sort(() => 0.5 - Math.random())
    }
}

</script>