import { Outlet, Route, Routes } from "react-router-dom"
import { Transactions } from "./components/Transactions"
import { PageTitle } from '_metronic/layout/core'


const EcommercePage = () => {
    return(
        <Routes>
            <Route element={<Outlet />}>
                <Route 
                    path="transactions"
                    element={
                        <>
                            <Transactions />
                        </>
                    }>
                </Route>
            </Route>
        </Routes>
    )
}

export default EcommercePage