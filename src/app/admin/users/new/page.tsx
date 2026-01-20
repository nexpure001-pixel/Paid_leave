import { Card } from "@/components/ui/Card";
import { NewUserForm } from "./NewUserForm";

export default function NewUserPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">社員登録</h1>

            <Card title="新規社員情報">
                <NewUserForm />
            </Card>
        </div>
    );
}
